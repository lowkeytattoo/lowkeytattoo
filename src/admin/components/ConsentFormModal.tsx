import { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@shared/lib/supabase";
import { ARTISTS, type Artist } from "@shared/config/artists";
import {
  CONSENT_TEMPLATE_VERSION, QUESTIONS, TYPE_LABEL, NORM_REF, PHOTOTYPES, LEGAL_TEXT, HEALTH_TEXT, CARE_TEXT,
  rgpdText, imageOptions, NO_IMAGE, fmtDate, sha256Hex, compressImage, buildPdf,
} from "@admin/lib/consentDocument";
import type { Client, ConsentFormType, ConsentFormData, ConsentImagePermissions } from "@shared/types/index";
import { useCreateConsentForm } from "@admin/hooks/useConsentForms";
import { useApplicatorLegalInfo } from "@admin/hooks/useArtistLegalInfo";
import { useUpdateClient } from "@admin/hooks/useClients";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { ageOn } from "@admin/lib/age";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════════
// Consentimiento informado — plantilla 2.0 (RGPD, Fase 1, 28/11/2026)
// Plan: docs/PLAN_MEJORA_CONSENTIMIENTOS_2026-11-27.md
//
// Pasos: Intervención → Cliente (edad / representante) → Cuestionario →
// Consentimientos (procedimiento · salud · imagen) → Revisión y firmas
// (cliente · representante · aplicador).
//
// Integridad: hora del servidor (server_now + trigger), created_by y estado
// fijados por la base de datos, SHA-256 del PDF, id del documento = id de la
// fila, la firma solo está en el PDF. La foto del documento del representante
// se guarda como archivo aparte y NUNCA se incrusta en el PDF.
//
// ⚠️ Textos pendientes de validar por el asesor (V-01 salud, V-02 láser,
// V-03 modelo canario y menores): HEALTH_TEXT, LEGAL_TEXT, MINOR_TEXT.
// Al cambiar cualquier texto o pregunta, subir CONSENT_TEMPLATE_VERSION.
// ═══════════════════════════════════════════════════════════════════════════

const MIN_AGE = 16;   // política del estudio
const ADULT_AGE = 18;

// La función SQL server_now() no está en el tipo Database generado.
const db = supabase as unknown as SupabaseClient;

// ─── Componente ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  client: Pick<Client, "id" | "name" | "phone" | "email" | "birthday">;
  /** Artista de la cuenta actual (aplicador por defecto). */
  artist: Artist;
  /** Si es un documento corregido: id del consentimiento anulado al que sustituye. */
  replacesId?: string | null;
  /** Valores iniciales (documento corregido). */
  initial?: { formType?: ConsentFormType; applicatorId?: string; sessionId?: string | null; zone?: string; description?: string };
}

const STEPS = ["intervencion", "cliente", "cuestionario", "consentimientos", "firmas"] as const;
type Step = typeof STEPS[number];
const STEP_LABEL: Record<Step, string> = {
  intervencion: "Intervención",
  cliente: "Cliente",
  cuestionario: "Cuestionario",
  consentimientos: "Consentimientos",
  firmas: "Revisión y firmas",
};

const label = "font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider";

export function ConsentFormModal({ open, onClose, client, artist, replacesId = null, initial }: Props) {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";
  const createConsent = useCreateConsentForm();
  const updateClient = useUpdateClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sigClient = useRef<SignatureCanvas>(null);
  const sigTutor = useRef<SignatureCanvas>(null);
  const sigApplicator = useRef<SignatureCanvas>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("intervencion");
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [step]);

  // Aplicador: un artista solo firma como él mismo; los dueños eligen.
  const ownArtist = ARTISTS.find((a) => a.id === profile?.artist_config_id && !a.hidden) ?? null;
  const selectableArtists = isOwner ? ARTISTS.filter((a) => !a.hidden) : ownArtist ? [ownArtist] : [];
  const defaultApplicator = initial?.applicatorId ?? (!artist.hidden ? artist.id : ownArtist?.id ?? "");

  // ── Paso 1 ──
  const [formType, setFormType] = useState<ConsentFormType | null>(initial?.formType ?? null);
  const [applicatorId, setApplicatorId] = useState<string>(defaultApplicator);
  const [sessionId, setSessionId] = useState<string>(initial?.sessionId ?? "");
  const [zone, setZone] = useState(initial?.zone ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [phototype, setPhototype] = useState("");
  const [laserSession, setLaserSession] = useState("");
  const [pigmentColors, setPigmentColors] = useState("");
  const [laserParams, setLaserParams] = useState("");
  // ── Paso 2 ──
  const [clientDni, setClientDni] = useState("");
  const [birthDate, setBirthDate] = useState(client.birthday ?? "");
  const [tutorName, setTutorName] = useState("");
  const [tutorRelation, setTutorRelation] = useState("");
  const [tutorDni, setTutorDni] = useState("");
  const [tutorVerified, setTutorVerified] = useState(false);
  const [tutorPhoto, setTutorPhoto] = useState<Blob | null>(null);
  const [tutorPhotoUrl, setTutorPhotoUrl] = useState<string | null>(null);
  // ── Paso 3 ──
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [details, setDetails] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  // ── Paso 4 ──
  const [cProcedure, setCProcedure] = useState(false);
  const [cCare, setCCare] = useState(false);
  const [cHealth, setCHealth] = useState(false);
  const [image, setImage] = useState<ConsentImagePermissions>(NO_IMAGE);
  // ── Paso 5 ──
  const [signed, setSigned] = useState({ client: false, tutor: false, applicator: false });
  const [saving, setSaving] = useState(false);

  const applicator = ARTISTS.find((a) => a.id === applicatorId) ?? null;
  const { data: legal, isLoading: legalLoading } = useApplicatorLegalInfo(open && applicatorId ? applicatorId : null);
  const applicatorNif = legal?.nif ?? null;
  const applicatorCert = legal?.sanitary_cert ?? null;

  const { data: sessions } = useQuery({
    queryKey: ["consent-client-sessions", client.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await db
        .from("sessions")
        .select("id, date, type, body_zone")
        .eq("client_id", client.id)
        .order("date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as { id: string; date: string; type: string; body_zone: string | null }[];
    },
  });

  const age = birthDate ? ageOn(birthDate, new Date()) : null;
  const isMinor = age !== null && age < ADULT_AGE;
  const tooYoung = age !== null && age < MIN_AGE;

  const availableTypes = (["tattoo", "piercing", "laser"] as ConsentFormType[]).filter((t) =>
    selectableArtists.some((a) => a.services.includes(t)),
  );
  const applicatorChoices = formType ? selectableArtists.filter((a) => a.services.includes(formType)) : [];

  const stepIndex = STEPS.indexOf(step);

  const reset = () => {
    setStep("intervencion");
    setFormType(initial?.formType ?? null);
    setApplicatorId(defaultApplicator);
    setSessionId(initial?.sessionId ?? ""); setZone(initial?.zone ?? ""); setDescription(initial?.description ?? "");
    setPhototype(""); setLaserSession(""); setPigmentColors(""); setLaserParams("");
    setClientDni(""); setBirthDate(client.birthday ?? "");
    setTutorName(""); setTutorRelation(""); setTutorDni(""); setTutorVerified(false);
    setTutorPhoto(null);
    if (tutorPhotoUrl) URL.revokeObjectURL(tutorPhotoUrl);
    setTutorPhotoUrl(null);
    setAnswers(initial?.formType ? new Array(QUESTIONS[initial.formType].length).fill(null) : []);
    setDetails(initial?.formType ? new Array(QUESTIONS[initial.formType].length).fill("") : []);
    setAdditionalInfo("");
    setCProcedure(false); setCCare(false); setCHealth(false); setImage(NO_IMAGE);
    setSigned({ client: false, tutor: false, applicator: false });
  };

  // Al abrir (p. ej. documento corregido) se aplican los valores iniciales
  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectType = (t: ConsentFormType) => {
    setFormType(t);
    setAnswers(new Array(QUESTIONS[t].length).fill(null));
    setDetails(new Array(QUESTIONS[t].length).fill(""));
    if (!selectableArtists.find((a) => a.id === applicatorId)?.services.includes(t)) {
      const first = selectableArtists.find((a) => a.services.includes(t));
      setApplicatorId(first?.id ?? "");
    }
  };

  const onPickSession = (id: string) => {
    setSessionId(id);
    const s = sessions?.find((x) => x.id === id);
    if (s?.body_zone && !zone) setZone(s.body_zone);
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await compressImage(file);
      if (tutorPhotoUrl) URL.revokeObjectURL(tutorPhotoUrl);
      setTutorPhoto(blob);
      setTutorPhotoUrl(URL.createObjectURL(blob));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ── Validaciones por paso ──
  const unanswered = answers.filter((a) => a === null).length;
  const missingDetails = answers.filter((a, i) => a === true && (details[i] ?? "").trim().length < 3).length;

  const canNext: Record<Step, boolean> = {
    intervencion: !!formType && !!applicator && !!applicatorNif && zone.trim().length >= 2 &&
      (formType !== "laser" || !!phototype),
    cliente: clientDni.trim().length >= 5 && age !== null && !tooYoung &&
      (!isMinor || (tutorName.trim().length >= 3 && tutorRelation.trim().length >= 3 && tutorDni.trim().length >= 5 && tutorVerified)),
    cuestionario: answers.length > 0 && unanswered === 0 && missingDetails === 0,
    consentimientos: cProcedure && cCare && cHealth,
    firmas: signed.client && signed.applicator && (!isMinor || signed.tutor),
  };

  const blockReason: Partial<Record<Step, string>> = {
    intervencion: !formType ? "Elige el tipo de intervención"
      : !applicator ? "Elige el aplicador"
      : legalLoading ? "Cargando datos del aplicador…"
      : !applicatorNif ? `Falta el DNI/NIE de ${applicator.name}: añádelo en Mi perfil → Datos legales`
      : zone.trim().length < 2 ? "Indica la zona"
      : formType === "laser" && !phototype ? "Indica el fototipo" : undefined,
    cliente: clientDni.trim().length < 5 ? "Falta el documento del cliente"
      : age === null ? "Falta la fecha de nacimiento"
      : tooYoung ? `No se realizan procedimientos a menores de ${MIN_AGE} años`
      : isMinor && !tutorVerified ? "Completa y comprueba los datos del representante" : undefined,
    cuestionario: unanswered > 0 ? `Faltan ${unanswered} ${unanswered === 1 ? "respuesta" : "respuestas"}`
      : missingDetails > 0 ? "Añade la aclaración de cada «Sí»" : undefined,
    consentimientos: !(cProcedure && cCare && cHealth) ? "Faltan las casillas obligatorias" : undefined,
    firmas: !signed.client ? "Falta la firma del cliente"
      : isMinor && !signed.tutor ? "Falta la firma del representante"
      : !signed.applicator ? "Falta la firma del aplicador" : undefined,
  };

  const goNext = () => {
    if (step === "cliente" && !client.birthday && birthDate) {
      // Guardar la fecha de nacimiento en la ficha si no estaba (no bloquea si falla)
      updateClient.mutate({ id: client.id, birthday: birthDate }, { onError: () => undefined });
    }
    setStep(STEPS[stepIndex + 1]);
  };

  const clearSig = (k: keyof typeof signed) => {
    ({ client: sigClient, tutor: sigTutor, applicator: sigApplicator })[k].current?.clear();
    setSigned((s) => ({ ...s, [k]: false }));
  };

  const handleSubmit = async () => {
    if (!formType || !applicator || !applicatorNif || age === null) return;
    if (!canNext.firmas) { toast.error(blockReason.firmas ?? "Faltan firmas"); return; }

    setSaving(true);
    const uploaded: string[] = [];
    try {
      // Hora del servidor (la base de datos la vuelve a comprobar)
      let signedAt = new Date();
      const { data: srv, error: srvErr } = await db.rpc("server_now");
      if (!srvErr && srv) signedAt = new Date(srv as string);

      const formId = crypto.randomUUID();
      const session = sessions?.find((s) => s.id === sessionId) ?? null;

      // 1. Foto del documento del representante: archivo aparte, nunca en el PDF
      let documentPhotoPath: string | null = null;
      if (isMinor && tutorPhoto) {
        documentPhotoPath = `${client.id}/representante_${formId}.jpg`;
        const { error } = await supabase.storage
          .from("consent-documents")
          .upload(documentPhotoPath, tutorPhoto, { contentType: "image/jpeg" });
        if (error) throw error;
        uploaded.push(documentPhotoPath);
      }

      const questions = QUESTIONS[formType];
      const formData: ConsentFormData = {
        // v1 (compatibilidad con listados y documentos antiguos)
        clientDni: clientDni.trim(),
        isMinor,
        tutorName: isMinor ? tutorName.trim() : undefined,
        tutorDni: isMinor ? tutorDni.trim() : undefined,
        tutorRelation: isMinor ? tutorRelation.trim() : undefined,
        questionnaire: questions.map((q, i) => ({
          q,
          a: answers[i] === true,
          ...(answers[i] === true ? { detail: details[i].trim() } : {}),
        })),
        additionalInfo: additionalInfo.trim(),
        artistId: applicator.id,
        artistName: applicator.name,
        artistNif: applicatorNif,
        formType,
        // v2
        templateVersion: CONSENT_TEMPLATE_VERSION,
        procedure: { zone: zone.trim(), description: description.trim(), sessionId: session?.id ?? null, sessionDate: session?.date ?? null },
        laser: formType === "laser"
          ? { phototype, sessionNumber: laserSession.trim(), pigmentColors: pigmentColors.trim(), parameters: laserParams.trim() }
          : undefined,
        applicator: { artistId: applicator.id, name: applicator.name, nif: applicatorNif, sanitaryCert: applicatorCert },
        client: { birthDate, ageAtSigning: age },
        minor: isMinor
          ? {
              tutorName: tutorName.trim(),
              tutorRelation: tutorRelation.trim(),
              tutorDni: tutorDni.trim(),
              verified: tutorVerified,
              verifiedBy: profile?.display_name ?? applicator.name,
              documentPhotoPath,
            }
          : null,
        consents: { procedure: cProcedure, careInstructions: cCare, healthData: cHealth, image },
        signatures: { client: true, tutor: isMinor, applicator: true },
      };

      // 2. PDF + huella
      const pdfBlob = buildPdf({
        formType,
        client,
        formData,
        signatures: {
          client: sigClient.current!.getCanvas().toDataURL("image/png"),
          tutor: isMinor ? sigTutor.current!.getCanvas().toDataURL("image/png") : null,
          applicator: sigApplicator.current!.getCanvas().toDataURL("image/png"),
        },
        signedAt,
        formId,
        replacesId,
      });
      const pdfSha256 = await sha256Hex(pdfBlob);

      const pdfPath = `${client.id}/${formType}_${formId}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("consent-documents")
        .upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
      if (upErr) throw upErr;
      uploaded.push(pdfPath);

      // 3. Registro (estado, autor y hora los fija/valida la base de datos)
      await createConsent.mutateAsync({
        id: formId,
        client_id: client.id,
        session_id: session?.id ?? null,
        type: formType,
        version: CONSENT_TEMPLATE_VERSION,
        form_data: formData,
        signature_data: null,
        pdf_storage_path: pdfPath,
        pdf_sha256: pdfSha256,
        replaces_id: replacesId,
        signed_at: signedAt.toISOString(),
        ip_address: null,
        user_agent: navigator.userAgent,
        created_by: null,
      });

      toast.success("Consentimiento firmado y guardado");
      handleClose();
    } catch (err) {
      console.error(err);
      // Sin registro, los archivos subidos no deben quedar sueltos
      if (uploaded.length > 0) {
        await supabase.storage.from("consent-documents").remove(uploaded).catch(() => undefined);
      }
      toast.error("Error al guardar el consentimiento. No se ha guardado nada; inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const sigBox = (k: keyof typeof signed, ref: React.RefObject<SignatureCanvas>, title: string, who: string) => (
    <div>
      <Label className={`${label} mb-1 block`}>{title}</Label>
      <p className="text-xs text-muted-foreground mb-2">{who}</p>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white dark:bg-white">
        <SignatureCanvas
          ref={ref}
          penColor="black"
          onEnd={() => setSigned((s) => ({ ...s, [k]: true }))}
          canvasProps={{ className: "w-full", style: { height: 160, touchAction: "none" } }}
        />
      </div>
      <Button variant="ghost" size="sm" className="mt-1 text-muted-foreground" onClick={() => clearSig(k)}>
        Borrar firma
      </Button>
    </div>
  );

  const yesNo = (v: boolean) => (v ? "Sí" : "No");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[92vh] flex flex-col p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="font-['IBM_Plex_Mono'] text-sm uppercase tracking-wider text-muted-foreground">
            {replacesId ? "Consentimiento corregido" : "Consentimiento informado"}
            {formType && <span className="text-foreground ml-2">— {TYPE_LABEL[formType]}</span>}
          </DialogTitle>
          <div className="flex gap-1.5 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1 rounded-full flex-1 transition-colors ${i <= stepIndex ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-['IBM_Plex_Mono']">
            Paso {stepIndex + 1} de {STEPS.length} · {STEP_LABEL[step]}
          </p>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-2">

          {/* ── PASO 1 · Intervención ── */}
          {step === "intervencion" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className={label}>Tipo de intervención *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {availableTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => selectType(t)}
                      className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                        formType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary"
                      }`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
                {formType && NORM_REF[formType] && (
                  <p className="text-[11px] text-muted-foreground">{NORM_REF[formType]}</p>
                )}
              </div>

              {formType && (
                <>
                  <div className="space-y-1.5">
                    <Label className={label}>Aplicador *</Label>
                    {applicatorChoices.length > 1 ? (
                      <select
                        value={applicatorId}
                        onChange={(e) => setApplicatorId(e.target.value)}
                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="">Elige al artista que realiza la intervención</option>
                        {applicatorChoices.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    ) : (
                      <div className="p-2.5 rounded-md border border-border bg-background text-sm">
                        {applicator?.name ?? "Tu cuenta no está asociada a un artista que realice este servicio"}
                      </div>
                    )}
                    {applicator && (
                      <div className="text-xs">
                        {legalLoading ? (
                          <span className="text-muted-foreground">Cargando datos legales…</span>
                        ) : applicatorNif ? (
                          <span className="text-muted-foreground font-['IBM_Plex_Mono']">
                            DNI/NIE: {applicatorNif}{applicatorCert ? ` · Cert.: ${applicatorCert}` : ""}
                          </span>
                        ) : (
                          <span className="text-destructive">
                            Falta el DNI/NIE de {applicator.name}. Debe añadirlo en Mi perfil → Datos legales (o un dueño en Artistas).
                          </span>
                        )}
                        {!legalLoading && applicatorNif && !applicatorCert && (
                          <span className="block text-amber-500 dark:text-amber-400 mt-0.5">
                            Falta el nº de certificado higiénico-sanitario (aviso, no bloquea).
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {(sessions ?? []).length > 0 && (
                    <div className="space-y-1.5">
                      <Label className={label}>Sesión (opcional)</Label>
                      <select
                        value={sessionId}
                        onChange={(e) => onPickSession(e.target.value)}
                        className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                      >
                        <option value="">Sin vincular a una sesión</option>
                        {(sessions ?? []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {fmtDate(s.date)} · {s.type}{s.body_zone ? ` · ${s.body_zone}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className={label}>Zona del cuerpo *</Label>
                    <Input value={zone} onChange={(e) => setZone(e.target.value)} maxLength={80} placeholder="Ej.: antebrazo izquierdo" className="bg-background border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={label}>Descripción breve del trabajo</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Ej.: rosa fine line, 8 cm" className="bg-background border-border" />
                    <p className="text-[11px] text-muted-foreground">Sin datos de salud: van en el cuestionario.</p>
                  </div>

                  {formType === "laser" && (
                    <div className="space-y-3 p-3 rounded-lg border border-border bg-background">
                      <p className={label}>Datos técnicos del láser</p>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Fototipo (Fitzpatrick) *</Label>
                        <div className="flex gap-1.5 flex-wrap">
                          {PHOTOTYPES.map((f) => (
                            <button key={f} type="button" aria-pressed={phototype === f} onClick={() => setPhototype(f)}
                              className={`min-w-[2.75rem] px-3 py-2 rounded text-xs font-['IBM_Plex_Mono'] font-bold ${phototype === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Nº de sesión</Label>
                          <Input value={laserSession} onChange={(e) => setLaserSession(e.target.value)} maxLength={10} placeholder="Ej.: 3" className="bg-card border-border" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Colores del pigmento</Label>
                          <Input value={pigmentColors} onChange={(e) => setPigmentColors(e.target.value)} maxLength={80} placeholder="Ej.: negro, rojo" className="bg-card border-border" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Parámetros / observaciones técnicas</Label>
                        <Textarea value={laserParams} onChange={(e) => setLaserParams(e.target.value)} maxLength={500} rows={2} placeholder="Longitud de onda, energía, tamaño de punto…" className="bg-card border-border" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PASO 2 · Cliente ── */}
          {step === "cliente" && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-background border border-border text-sm">
                <div className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground mb-1">Cliente</div>
                <div className="font-medium">{client.name}</div>
                {client.phone && <div className="text-muted-foreground text-xs">{client.phone}</div>}
                {client.email && <div className="text-muted-foreground text-xs truncate">{client.email}</div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={label}>DNI / NIE / Pasaporte *</Label>
                  <Input value={clientDni} onChange={(e) => setClientDni(e.target.value.toUpperCase())} maxLength={20} placeholder="12345678A" className="bg-background border-border uppercase" />
                </div>
                <div className="space-y-1.5">
                  <Label className={label}>Fecha de nacimiento *</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="bg-background border-border" />
                </div>
              </div>
              {age !== null && (
                <p className={`text-xs ${tooYoung ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  Edad: {age} años
                  {tooYoung && ` — No se realizan procedimientos a menores de ${MIN_AGE} años (política del estudio).`}
                </p>
              )}

              {isMinor && !tooYoung && (
                <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Cliente de {age} años: el representante legal debe estar presente, acreditar su condición y firmar.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <Label className={label}>Nombre del representante *</Label>
                      <Input value={tutorName} onChange={(e) => setTutorName(e.target.value)} maxLength={120} className="bg-background border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={label}>Relación *</Label>
                      <Input value={tutorRelation} onChange={(e) => setTutorRelation(e.target.value)} maxLength={60} placeholder="Padre / Madre / Tutor legal" className="bg-background border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={label}>DNI / NIE *</Label>
                      <Input value={tutorDni} onChange={(e) => setTutorDni(e.target.value.toUpperCase())} maxLength={20} className="bg-background border-border uppercase" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <input ref={photoInput} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                    <Button type="button" variant="outline" size="sm" onClick={() => photoInput.current?.click()}>
                      {tutorPhoto ? "Repetir foto del documento" : "Fotografiar documento del representante"}
                    </Button>
                    {tutorPhotoUrl && (
                      <div className="flex items-center gap-3">
                        <img src={tutorPhotoUrl} alt="Documento del representante" className="h-16 rounded border border-border object-cover" />
                        <button type="button" className="text-xs underline text-muted-foreground" onClick={() => { setTutorPhoto(null); if (tutorPhotoUrl) URL.revokeObjectURL(tutorPhotoUrl); setTutorPhotoUrl(null); }}>
                          Quitar foto
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Opcional. Se guarda como archivo privado aparte; no se incluye en el PDF ni en la copia del cliente.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="tutor-verified" checked={tutorVerified} onCheckedChange={(v) => setTutorVerified(!!v)} className="mt-0.5" />
                    <Label htmlFor="tutor-verified" className="text-sm cursor-pointer leading-snug">
                      He comprobado el documento del representante y su relación con el menor (libro de familia, resolución u otro documento acreditativo).
                    </Label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 3 · Cuestionario ── */}
          {step === "cuestionario" && formType && (
            <div className="py-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                El cliente responde personalmente <strong>todas</strong> las preguntas. Si responde «Sí», indica brevemente el detalle.
              </p>
              {QUESTIONS[formType].map((q, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-background border border-border space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-foreground flex-1 leading-snug pt-0.5">{q}</span>
                    <div className="flex gap-1.5 shrink-0">
                      {([false, true] as const).map((v) => (
                        <button
                          key={String(v)}
                          type="button"
                          aria-pressed={answers[i] === v}
                          onClick={() => setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)))}
                          className={`min-w-[3rem] px-3 py-2 rounded text-xs font-['IBM_Plex_Mono'] font-bold transition-colors ${
                            answers[i] === v
                              ? v ? "bg-destructive text-destructive-foreground" : "bg-emerald-600 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {v ? "Sí" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {answers[i] === true && (
                    <Input
                      value={details[i] ?? ""}
                      onChange={(e) => setDetails((prev) => prev.map((d, idx) => (idx === i ? e.target.value : d)))}
                      maxLength={200}
                      placeholder="Aclaración (obligatoria)"
                      className="bg-card border-border text-sm"
                    />
                  )}
                </div>
              ))}
              <div className="space-y-1.5 mt-3">
                <Label className={label}>Observaciones (opcional)</Label>
                <Textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} maxLength={1000} rows={2} className="bg-background border-border" />
              </div>
            </div>
          )}

          {/* ── PASO 4 · Consentimientos ── */}
          {step === "consentimientos" && formType && applicator && (
            <div className="py-4 space-y-4">
              <section className="p-4 rounded-lg bg-background border border-border space-y-3">
                <p className={`${label} text-muted-foreground`}>1 · Procedimiento y riesgos (obligatorio)</p>
                <p className="text-sm text-foreground leading-relaxed">{LEGAL_TEXT[formType]}</p>
                <div className="flex items-start gap-2">
                  <Checkbox id="c-proc" checked={cProcedure} onCheckedChange={(v) => setCProcedure(!!v)} className="mt-0.5" />
                  <Label htmlFor="c-proc" className="text-sm cursor-pointer leading-snug">He leído y comprendo la información anterior y doy mi consentimiento libre e informado para la realización del procedimiento.</Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="c-care" checked={cCare} onCheckedChange={(v) => setCCare(!!v)} className="mt-0.5" />
                  <Label htmlFor="c-care" className="text-sm cursor-pointer leading-snug">{CARE_TEXT}</Label>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-background border border-border space-y-3">
                <p className={`${label} text-muted-foreground`}>2 · Datos de salud (obligatorio)</p>
                <p className="text-sm text-foreground leading-relaxed">{HEALTH_TEXT}</p>
                <div className="flex items-start gap-2">
                  <Checkbox id="c-health" checked={cHealth} onCheckedChange={(v) => setCHealth(!!v)} className="mt-0.5" />
                  <Label htmlFor="c-health" className="text-sm cursor-pointer leading-snug">Presto mi consentimiento explícito para el tratamiento de mis datos de salud con esta finalidad.</Label>
                </div>
              </section>

              <section className="p-4 rounded-lg bg-background border border-border space-y-3">
                <p className={`${label} text-muted-foreground`}>3 · Fotografías (voluntario)</p>
                <p className="text-xs text-muted-foreground">Marca solo lo que autorices. Negarte no afecta al servicio y puedes retirarlo cuando quieras.</p>
                {imageOptions(applicator).map((o) => (
                  <div key={o.key} className="flex items-start gap-2">
                    <Checkbox id={`img-${o.key}`} checked={image[o.key]} onCheckedChange={(v) => setImage((s) => ({ ...s, [o.key]: !!v }))} className="mt-0.5" />
                    <Label htmlFor={`img-${o.key}`} className="text-sm cursor-pointer leading-snug">{o.label}</Label>
                  </div>
                ))}
              </section>

              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Protección de datos:</strong> {rgpdText(formType)}
              </p>
            </div>
          )}

          {/* ── PASO 5 · Revisión y firmas ── */}
          {step === "firmas" && formType && applicator && (
            <div className="py-4 space-y-5">
              <div className="p-3 rounded-lg bg-background border border-border text-sm space-y-1">
                <p className={`${label} text-muted-foreground mb-1`}>Resumen</p>
                <p><strong>{TYPE_LABEL[formType]}</strong> · {zone}{description ? ` · ${description}` : ""}</p>
                <p>Aplicador: {applicator.name} · DNI/NIE {applicatorNif}</p>
                <p>Cliente: {client.name} · {clientDni} · {age} años</p>
                {isMinor && <p>Representante: {tutorName} ({tutorRelation}) · {tutorDni}{tutorPhoto ? " · foto del documento adjunta" : ""}</p>}
                <p>Cuestionario: {answers.filter((a) => a === true).length} respuestas «Sí»</p>
                <p>Procedimiento: {yesNo(cProcedure)} · Cuidados: {yesNo(cCare)} · Datos de salud: {yesNo(cHealth)}</p>
                <p>
                  Fotos — interna: {yesNo(image.internal)} · web: {yesNo(image.studioWeb)} · redes Lowkey: {yesNo(image.studioSocial)} ·
                  portfolio {applicator.name}: {yesNo(image.artistPortfolio)} · redes {applicator.name}: {yesNo(image.artistSocial)}
                </p>
              </div>

              {sigBox("client", sigClient, "Firma del cliente", client.name)}
              {isMinor && sigBox("tutor", sigTutor, "Firma del representante legal", `${tutorName} (${tutorRelation})`)}
              {sigBox("applicator", sigApplicator, "Firma del aplicador", applicator.name)}
            </div>
          )}
        </div>

        {/* Pie con navegación */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          {step !== "intervencion" ? (
            <Button variant="outline" onClick={() => setStep(STEPS[stepIndex - 1])} disabled={saving}>Anterior</Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}

          {!canNext[step] && blockReason[step] && (
            <span className="text-xs text-muted-foreground text-center flex-1">{blockReason[step]}</span>
          )}

          {step !== "firmas" ? (
            <Button className="cta-button" onClick={goNext} disabled={!canNext[step]}>Siguiente</Button>
          ) : (
            <Button className="cta-button" onClick={handleSubmit} disabled={saving || !canNext.firmas}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : "Firmar y guardar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
