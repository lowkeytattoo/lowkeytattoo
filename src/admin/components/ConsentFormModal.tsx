import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { supabase } from "@shared/lib/supabase";
import type { Artist } from "@shared/config/artists";
import type { Client, ConsentFormType, ConsentFormData } from "@shared/types/index";
import { CONTACT } from "@web/config/contact";
import { PIRATA_ONE_B64 } from "@admin/lib/pirataOneFont";
import { useCreateConsentForm } from "@admin/hooks/useConsentForms";
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

// ─── Cuestionarios por tipo ──────────────────────────────────────────────────

const TATTOO_QUESTIONS = [
  "¿Tiene o ha tenido enfermedades de la piel (psoriasis, eccema, vitiligo, queloides)?",
  "¿Padece trastornos de coagulacion o hemorragias?",
  "¿Es diabetico/a?",
  "¿Tiene VIH, hepatitis u otras enfermedades de transmision sanguinea?",
  "¿Padece enfermedades cardiacas o lleva marcapasos?",
  "¿Tiene el sistema inmunologico comprometido?",
  "¿Toma anticoagulantes, aspirina u otros antiinflamatorios?",
  "¿Toma isotretinoina (Roacutane) actualmente o en los ultimos 6 meses?",
  "¿Es alergico/a a algun medicamento, tinte o material?",
  "¿Esta embarazada o en periodo de lactancia?",
  "¿Ha consumido alcohol o drogas en las ultimas 24 horas?",
  "¿Tiene heridas, infecciones o irritacion en la zona a tatuar?",
  "¿Ha tenido reacciones adversas a tatuajes anteriores?",
];

const PIERCING_QUESTIONS = [
  "¿Tiene tendencia a formar queloides o cicatrices elevadas?",
  "¿Padece diabetes o enfermedad que ralentice la cicatrizacion?",
  "¿Tiene alguna alteracion del sistema inmunologico?",
  "¿Toma anticoagulantes, aspirina o antiinflamatorios?",
  "¿Es alergico/a a metales (niquel, cobalto, cromo)?",
  "¿Es alergico/a al latex u otro material?",
  "¿Tiene VIH, hepatitis u otras enfermedades de transmision sanguinea?",
  "¿Tiene enfermedades cardiacas o lleva protesis valvular?",
  "¿Esta embarazada o en periodo de lactancia?",
  "¿Ha consumido alcohol o drogas en las ultimas 24 horas?",
  "¿Tiene infeccion, herida o irritacion en la zona a perforar?",
  "¿Tiene antecedentes de rechazo a piercings anteriores?",
  "¿Lleva protesis metalicas, marcapasos u otros implantes?",
  "¿Esta tomando algun medicamento actualmente?",
];

const LASER_QUESTIONS = [
  "¿Esta embarazada o en periodo de lactancia?",
  "¿Tiene o ha tenido cancer de piel?",
  "¿Tiene lesiones sospechosas o nevos en la zona a tratar?",
  "¿Padece epilepsia fotosensible?",
  "¿Tiene tendencia a formar queloides o cicatrices hipertroficas?",
  "¿Ha tomado isotretinoina en los ultimos 6 meses?",
  "¿Toma fotosensibilizantes (antibioticos, diureticos, antidepresivos)?",
  "¿Toma anticoagulantes?",
  "¿Padece diabetes o enfermedad que ralentice la cicatrizacion?",
  "¿Tiene el sistema inmunologico comprometido?",
  "¿Tiene vitiligo, psoriasis u otras enfermedades cutaneas activas?",
  "¿Ha tenido herpes recurrente en la zona a tratar?",
  "¿Se ha expuesto al sol o cabinas de bronceado en las ultimas 4 semanas?",
  "¿Tiene tatuajes de henna negra o pigmentos metalicos en la zona?",
  "¿Lleva implantes metalicos o marcapasos cerca de la zona?",
  "¿Ha tenido tratamientos con acidos o peelings en los ultimos 30 dias?",
  "¿Ha tenido rellenos con acido hialuronico en la zona?",
];

const QUESTIONS: Record<ConsentFormType, string[]> = {
  tattoo: TATTOO_QUESTIONS,
  piercing: PIERCING_QUESTIONS,
  laser: LASER_QUESTIONS,
};

const TYPE_LABEL: Record<ConsentFormType, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Laser",
};

const NORM_REF: Record<ConsentFormType, string> = {
  tattoo: "Conforme al Real Decreto 1088/2009 y Decreto 33/2012 de Canarias",
  piercing: "Conforme al Real Decreto 1088/2009 y Decreto 33/2012 de Canarias",
  laser: "Conforme a la Ley 41/2002 y normativa de equipos laser clase IV",
};

const LEGAL_TEXT: Record<ConsentFormType, string> = {
  tattoo:
    "Declaro haber sido informado/a de manera clara y comprensible sobre el procedimiento de tatuaje que voy a realizar. Comprendo que un tatuaje es un procedimiento permanente que implica la introducción de pigmentos en la dermis mediante agujas estériles de un solo uso, y que puede conllevar riesgos como infección, reacción alérgica a los pigmentos, formación de queloides, pérdida de color durante la cicatrización u otras complicaciones. Entiendo que el resultado puede variar según mi tipo de piel y proceso de cicatrización individual, y que pueden ser necesarios retoques posteriores sin coste adicional en el plazo indicado por el artista. Me comprometo a seguir las instrucciones de cuidado postprocedimiento facilitadas y a consultar a un médico ante cualquier signo de alarma. La información facilitada en el cuestionario médico es verídica y completa. Presto mi consentimiento de forma libre, voluntaria e informada para la realización del tatuaje, pudiendo revocarlo en cualquier momento antes del inicio del procedimiento.",
  piercing:
    "Declaro haber sido informado/a de manera clara y comprensible sobre el procedimiento de piercing que voy a realizar. Comprendo que un piercing implica la perforación de tejido corporal y que puede conllevar riesgos como infección, rechazo o migración del piercing, formación de queloides, reacción alérgica al material de la joya u otras complicaciones descritas en este documento. Entiendo que el tiempo de cicatrización varía según la zona y puede extenderse varios meses, y que debo seguir las instrucciones de cuidado para evitar complicaciones. Me comprometo a no manipular la joya hasta la cicatrización completa y a consultar a un médico ante cualquier signo de alarma. La información facilitada en el cuestionario médico es verídica y completa. Presto mi consentimiento de forma libre, voluntaria e informada para la realización del piercing, pudiendo revocarlo en cualquier momento antes del inicio del procedimiento.",
  laser:
    "Declaro haber sido informado/a de manera clara y comprensible sobre el tratamiento con láser que voy a realizar. Comprendo que el láser es un procedimiento médico-estético que puede conllevar riesgos como enrojecimiento transitorio, hiperpigmentación o hipopigmentación post-inflamatoria, quemadura superficial, infección u otras complicaciones descritas en este documento. Entiendo que los resultados no están garantizados al 100%, que pueden requerirse varias sesiones y que la respuesta varía según el fototipo de piel, el color del pigmento y otros factores individuales. Me comprometo a seguir las instrucciones de protección solar y cuidados posteriores, y a comunicar cualquier cambio en mi estado de salud o medicación antes de cada sesión. La información facilitada en el cuestionario médico es verídica y completa. Presto mi consentimiento de forma libre, voluntaria e informada para la realización del tratamiento con láser, pudiendo revocarlo en cualquier momento antes del inicio del procedimiento.",
};

const RGPD_TEXT =
  "Los datos personales seran tratados por LOWKEY TATTOO TENERIFE conforme al RGPD (UE) 2016/679 y LOPD-GDD 3/2018, con finalidad de gestion del consentimiento informado e historial clinico. Conservacion: 5 anios. Puede ejercer sus derechos en info@tattoolowkey.com.";

// ─── Generacion del PDF ──────────────────────────────────────────────────────

interface PdfParams {
  formType: ConsentFormType;
  artist: Artist;
  client: Pick<Client, "name" | "phone" | "email" | "birthday">;
  formData: ConsentFormData;
  signatureDataUrl: string;
  signedAt: Date;
  formId: string;
}

function buildPdf(p: PdfParams): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Registrar Pirata One para el título de cabecera
  pdf.addFileToVFS("PirataOne.ttf", PIRATA_ONE_B64);
  pdf.addFont("PirataOne.ttf", "PirataOne", "normal");

  const W = 210, H = 297;
  const ml = 14, mr = 14;
  const tw = W - ml - mr;
  let y = 0;

  // ── helpers ──────────────────────────────────────────────────────────────────
  const np = (need = 6) => {
    if (y + need > H - 14) { pdf.addPage(); y = 16; }
  };

  const h2 = (t: string) => {
    np(9);
    pdf.setFontSize(8.5).setFont("helvetica", "bold");
    pdf.text(t, ml, y);
    y += 5.5;
  };

  const body = (t: string, x = ml, maxW = tw) => {
    pdf.setFontSize(8).setFont("helvetica", "normal");
    const lines = pdf.splitTextToSize(t, maxW);
    np(lines.length * 4.2);
    pdf.text(lines, x, y);
    y += lines.length * 4.2;
  };

  const hr = (gap = 5) => {
    np(gap + 2);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(ml, y, W - mr, y);
    y += gap;
  };

  const colLabel = (t: string, x: number) => {
    pdf.setFontSize(7).setFont("helvetica", "bold").setTextColor(120, 120, 120);
    pdf.text(t, x, y);
    pdf.setTextColor(0, 0, 0);
  };

  // ── Cabecera ─────────────────────────────────────────────────────────────
  const hdrH = 28;
  pdf.setFillColor(18, 18, 18);
  pdf.rect(0, 0, W, hdrH, "F");

  // Nombre del estudio — Pirata One
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18).setFont("PirataOne", "normal");
  pdf.text("Lowkey Tattoo Tenerife", ml, 14);

  // Datos del estudio
  pdf.setFontSize(7).setFont("helvetica", "normal").setTextColor(200, 200, 200);
  pdf.text(CONTACT.address, ml, 20);
  pdf.text(`${CONTACT.phonePretty}  ·  ${CONTACT.website}  ·  ${CONTACT.email}`, ml, 25);

  pdf.setTextColor(0, 0, 0);
  y = hdrH + 6;

  // ── Título ───────────────────────────────────────────────────────────────
  pdf.setFontSize(11).setFont("helvetica", "bold");
  pdf.text(`CONSENTIMIENTO INFORMADO — ${TYPE_LABEL[p.formType].toUpperCase()}`, ml, y);
  y += 5.5;
  pdf.setFontSize(7).setFont("helvetica", "normal").setTextColor(130, 130, 130);
  pdf.text(NORM_REF[p.formType], ml, y);
  pdf.setTextColor(0, 0, 0);
  y += 6;
  hr(4);

  // ── Profesional | Cliente (dos columnas con yL/yR independientes) ─────────
  const colW = (tw - 6) / 2;
  const col2 = ml + colW + 6;
  let yL = y;
  let yR = y;

  // Columna izquierda: Profesional
  colLabel("PROFESIONAL RESPONSABLE", ml);
  yL += 4.5;
  pdf.setFontSize(9).setFont("helvetica", "bold");
  pdf.text(p.artist.name, ml, yL); yL += 5;
  pdf.setFontSize(8).setFont("helvetica", "normal");
  pdf.text(`DNI: ${p.artist.nif ?? "[Pendiente]"}`, ml, yL); yL += 4.5;
  if (p.artist.hygienicSanitaryCert) {
    pdf.text(`Cert: ${p.artist.hygienicSanitaryCert}`, ml, yL); yL += 4.5;
  }

  // Columna derecha: Cliente (yR independiente, posición x = col2)
  colLabel("CLIENTE", col2);
  yR += 4.5;
  pdf.setFontSize(9).setFont("helvetica", "bold");
  pdf.text(p.client.name, col2, yR); yR += 5;
  pdf.setFontSize(8).setFont("helvetica", "normal");
  pdf.text(`DNI/NIE: ${p.formData.clientDni || "—"}`, col2, yR); yR += 4.5;
  if (p.client.phone) { pdf.text(`Tel: ${p.client.phone}`, col2, yR); yR += 4.5; }
  if (p.client.email) {
    const emailLines = pdf.splitTextToSize(`Email: ${p.client.email}`, colW);
    pdf.text(emailLines, col2, yR); yR += emailLines.length * 4.5;
  }
  if (p.client.birthday) { pdf.text(`Nac: ${p.client.birthday}`, col2, yR); yR += 4.5; }

  y = Math.max(yL, yR) + 4;
  hr(5);

  // ── Cuestionario médico ───────────────────────────────────────────────────
  h2("CUESTIONARIO MÉDICO PREVIO");
  p.formData.questionnaire.forEach((item) => {
    np(5);
    pdf.setFontSize(8).setFont("helvetica", "normal").setTextColor(0, 0, 0);
    const qLines = pdf.splitTextToSize(item.q, tw - 14);
    pdf.text(qLines, ml + 2, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(item.a ? 180 : 40, item.a ? 40 : 140, 0);
    pdf.text(item.a ? "SÍ" : "NO", W - mr - 7, y);
    pdf.setTextColor(0, 0, 0);
    y += qLines.length * 4.2 + 1;
  });

  if (p.formData.additionalInfo) {
    y += 2;
    h2("INFORMACIÓN ADICIONAL");
    body(p.formData.additionalInfo);
  }

  if (p.formData.isMinor) {
    y += 2;
    hr(4);
    h2("REPRESENTANTE LEGAL (MENOR DE EDAD)");
    body(`Tutor: ${p.formData.tutorName ?? ""}   ·   DNI: ${p.formData.tutorDni ?? ""}   ·   Relación: ${p.formData.tutorRelation ?? ""}`);
  }

  y += 4;
  hr(5);

  // ── Declaración + RGPD ───────────────────────────────────────────────────
  h2("DECLARACIÓN DE CONSENTIMIENTO INFORMADO");
  body(LEGAL_TEXT[p.formType]);
  y += 4;
  pdf.setFontSize(8).setFont("helvetica", "bold").setTextColor(80, 80, 80);
  pdf.text("PROTECCIÓN DE DATOS", ml, y); y += 4.5;
  pdf.setFont("helvetica", "normal").setFontSize(7.5);
  const rgpdLines = pdf.splitTextToSize(RGPD_TEXT, tw);
  np(rgpdLines.length * 3.8);
  pdf.text(rgpdLines, ml, y);
  pdf.setTextColor(0, 0, 0);
  y += rgpdLines.length * 3.8 + 5;
  hr(5);

  // ── Firma: metadatos a la izquierda, caja de firma a la derecha ───────────
  const sigH = 36;
  const metaW = 88;
  const sigBoxW = tw - metaW - 6;
  const sigX = ml + metaW + 6;
  np(sigH + 6);
  const sigRowY = y;

  pdf.setFontSize(8.5).setFont("helvetica", "bold");
  pdf.text("FIRMA DEL CLIENTE", ml, y); y += 7;
  pdf.setFontSize(8).setFont("helvetica", "normal");
  pdf.text(`Fecha y hora:  ${format(p.signedAt, "dd/MM/yyyy  HH:mm:ss")}`, ml, y); y += 5;
  pdf.setFontSize(7).setTextColor(130, 130, 130);
  const idLines = pdf.splitTextToSize(`Documento: ${p.formId}`, metaW - 2);
  pdf.text(idLines, ml, y);
  pdf.setTextColor(0, 0, 0);

  pdf.setDrawColor(180, 180, 180);
  pdf.rect(sigX, sigRowY, sigBoxW, sigH);
  try {
    pdf.addImage(p.signatureDataUrl, "PNG", sigX + 1.5, sigRowY + 1.5, sigBoxW - 3, sigH - 3, "", "FAST");
  } catch (_) {}

  y = sigRowY + sigH + 4;

  // ── Pie de página ─────────────────────────────────────────────────────────
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7).setTextColor(170, 170, 170);
    pdf.text(
      `LOWKEY TATTOO TENERIFE  ·  Versión 1.0  ·  Generado: ${format(p.signedAt, "dd/MM/yyyy HH:mm:ss")}`,
      ml, H - 8
    );
    pdf.text(`${i} / ${pageCount}`, W - mr - 8, H - 8);
    pdf.setTextColor(0, 0, 0);
  }

  return pdf.output("blob");
}

// ─── Componente ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  client: Pick<Client, "id" | "name" | "phone" | "email" | "birthday">;
  artist: Artist;
}

const STEPS = ["tipo", "datos", "cuestionario", "firma"] as const;
type Step = typeof STEPS[number];

export function ConsentFormModal({ open, onClose, client, artist }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const createConsent = useCreateConsentForm();

  const [step, setStep] = useState<Step>("tipo");
  const [formType, setFormType] = useState<ConsentFormType | null>(null);
  const [clientDni, setClientDni] = useState("");
  const [isMinor, setIsMinor] = useState(false);
  const [tutorName, setTutorName] = useState("");
  const [tutorDni, setTutorDni] = useState("");
  const [tutorRelation, setTutorRelation] = useState("");
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  const handleClose = () => {
    setStep("tipo");
    setFormType(null);
    setClientDni("");
    setIsMinor(false);
    setTutorName(""); setTutorDni(""); setTutorRelation("");
    setAnswers([]);
    setAdditionalInfo("");
    setAccepted(false);
    sigRef.current?.clear();
    onClose();
  };

  const selectType = (t: ConsentFormType) => {
    setFormType(t);
    setAnswers(new Array(QUESTIONS[t].length).fill(false));
    setStep("datos");
  };

  const toggleAnswer = (i: number) => {
    setAnswers((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const handleSubmit = async () => {
    if (!formType) return;
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("La firma es obligatoria");
      return;
    }
    if (!accepted) {
      toast.error("Debes aceptar la declaración");
      return;
    }

    setSaving(true);
    try {
      const signatureDataUrl = sigRef.current.getCanvas().toDataURL("image/png");
      const signedAt = new Date();
      const formId = crypto.randomUUID();

      const questions = QUESTIONS[formType];
      const formData: ConsentFormData = {
        clientDni,
        isMinor,
        tutorName: isMinor ? tutorName : undefined,
        tutorDni: isMinor ? tutorDni : undefined,
        tutorRelation: isMinor ? tutorRelation : undefined,
        questionnaire: questions.map((q, i) => ({ q, a: answers[i] ?? false })),
        additionalInfo,
        artistId: artist.id,
        artistName: artist.name,
        artistNif: artist.nif ?? "",
        formType,
      };

      const pdfBlob = buildPdf({
        formType,
        artist,
        client,
        formData,
        signatureDataUrl,
        signedAt,
        formId,
      });

      const fileName = `${client.id}/${formType}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("consent-documents")
        .upload(fileName, pdfBlob, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      await createConsent.mutateAsync({
        client_id: client.id,
        session_id: null,
        type: formType,
        version: "1.0",
        form_data: formData,
        signature_data: signatureDataUrl,
        pdf_storage_path: fileName,
        signed_at: signedAt.toISOString(),
        ip_address: null,
        user_agent: navigator.userAgent,
        created_by: null,
      });

      toast.success("Consentimiento firmado y guardado");
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el consentimiento");
    } finally {
      setSaving(false);
    }
  };

  const canProceedFromDatos = clientDni.trim().length >= 8;
  const canProceedFromCuestionario = answers.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[92vh] flex flex-col p-0 gap-0 bg-card border-border">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="font-['IBM_Plex_Mono'] text-sm uppercase tracking-wider text-muted-foreground">
            Consentimiento informado
            {formType && (
              <span className="text-foreground ml-2">— {TYPE_LABEL[formType]}</span>
            )}
          </DialogTitle>
          {/* Barra de progreso */}
          <div className="flex gap-1.5 mt-3">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 rounded-full flex-1 transition-colors ${
                  i <= stepIndex ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">

          {/* PASO 1 — Tipo */}
          {step === "tipo" && (
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona el tipo de procedimiento para el que se genera el consentimiento.
              </p>
              {(["tattoo", "piercing", "laser"] as ConsentFormType[])
                .filter((t) => artist.services.includes(t))
                .map((t) => (
                  <button
                    key={t}
                    onClick={() => selectType(t)}
                    className="w-full text-left p-4 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <div className="font-semibold text-foreground group-hover:text-primary">
                      {TYPE_LABEL[t]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t === "tattoo" && "Consentimiento para tatuaje · Real Decreto 1088/2009"}
                      {t === "piercing" && "Consentimiento para piercing · Real Decreto 1088/2009"}
                      {t === "laser" && "Consentimiento para tratamiento laser · Ley 41/2002"}
                    </div>
                  </button>
                ))}
            </div>
          )}

          {/* PASO 2 — Datos personales */}
          {step === "datos" && (
            <div className="space-y-4 py-4">
              {/* Cliente + Profesional lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background border border-border text-sm space-y-1">
                  <div className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground mb-1.5">Cliente</div>
                  <div className="font-medium leading-tight">{client.name}</div>
                  {client.phone && <div className="text-muted-foreground text-xs">{client.phone}</div>}
                  {client.email && <div className="text-muted-foreground text-xs truncate">{client.email}</div>}
                </div>
                <div className="p-3 rounded-lg bg-background border border-border text-sm space-y-1">
                  <div className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground mb-1.5">Profesional</div>
                  <div className="font-medium leading-tight">{artist.name}</div>
                  {artist.nif ? (
                    <div className="text-muted-foreground text-xs font-['IBM_Plex_Mono']">DNI: {artist.nif}</div>
                  ) : (
                    <div className="text-amber-500 dark:text-amber-400 text-xs">DNI: pendiente</div>
                  )}
                  {artist.hygienicSanitaryCert && (
                    <div className="text-muted-foreground text-xs">Cert: {artist.hygienicSanitaryCert}</div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                  DNI / NIE / Pasaporte *
                </Label>
                <Input
                  value={clientDni}
                  onChange={(e) => setClientDni(e.target.value.toUpperCase())}
                  placeholder="12345678A"
                  className="bg-background border-border uppercase"
                  maxLength={20}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-minor"
                  checked={isMinor}
                  onCheckedChange={(v) => setIsMinor(!!v)}
                />
                <Label htmlFor="is-minor" className="text-sm cursor-pointer">
                  El cliente es menor de edad (requiere tutor legal)
                </Label>
              </div>

              {isMinor && (
                <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Se requiere la firma del tutor legal. Solicita el documento acreditativo (libro de familia o DNI del tutor).
                  </p>
                  <div className="space-y-1.5">
                    <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre del tutor *</Label>
                    <Input value={tutorName} onChange={(e) => setTutorName(e.target.value)} className="bg-background border-border" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">DNI del tutor *</Label>
                    <Input value={tutorDni} onChange={(e) => setTutorDni(e.target.value.toUpperCase())} className="bg-background border-border uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Relación con el menor</Label>
                    <Input value={tutorRelation} onChange={(e) => setTutorRelation(e.target.value)} placeholder="Padre / Madre / Tutor legal" className="bg-background border-border" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3 — Cuestionario medico */}
          {step === "cuestionario" && formType && (
            <div className="py-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                El cliente responde personalmente. Pulsa <strong>Sí</strong> si alguna pregunta aplica.
              </p>
              {QUESTIONS[formType].map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-background border border-border"
                >
                  <span className="text-sm text-foreground flex-1 leading-snug pt-0.5">{q}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => !answers[i] || toggleAnswer(i)}
                      className={`px-3 py-1 rounded text-xs font-['IBM_Plex_Mono'] font-bold transition-colors ${
                        !answers[i]
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => answers[i] || toggleAnswer(i)}
                      className={`px-3 py-1 rounded text-xs font-['IBM_Plex_Mono'] font-bold transition-colors ${
                        answers[i]
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      Sí
                    </button>
                  </div>
                </div>
              ))}
              <div className="space-y-1.5 mt-3">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                  Información adicional (si alguna respuesta fue Sí)
                </Label>
                <Textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Especifique aquí..."
                  className="bg-background border-border"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* PASO 4 — Firma */}
          {step === "firma" && formType && (
            <div className="py-4 space-y-4">
              {/* Texto legal completo */}
              <div className="p-4 rounded-lg bg-background border border-border space-y-3">
                <div className="text-[10px] font-['IBM_Plex_Mono'] uppercase tracking-wider text-muted-foreground">
                  Declaración de consentimiento informado
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {LEGAL_TEXT[formType]}
                </p>
                <div className="pt-1 border-t border-border text-xs text-muted-foreground leading-relaxed">
                  <strong>Protección de datos:</strong> Sus datos serán tratados por LOW TATTOO TENERIFE conforme al RGPD (UE) 2016/679 y LOPD-GDD 3/2018, con la finalidad exclusiva de gestionar el historial clínico y el consentimiento informado. Conservación: 5 años desde la última prestación de servicios. Puede ejercer sus derechos de acceso, rectificación, supresión u oposición en info@tattoolowkey.com.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="accepted"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(!!v)}
                  className="mt-0.5"
                />
                <Label htmlFor="accepted" className="text-sm cursor-pointer leading-snug">
                  He leído y comprendo el texto anterior. Doy mi consentimiento libre e informado para la realización del procedimiento.
                </Label>
              </div>

              {/* Canvas de firma */}
              <div>
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider mb-2 block">
                  Firma del cliente
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Firme con el dedo o Apple Pencil en el recuadro.
                </p>
                <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white dark:bg-white">
                  <SignatureCanvas
                    ref={sigRef}
                    penColor="black"
                    canvasProps={{
                      className: "w-full",
                      style: { height: 180, touchAction: "none" },
                    }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1.5 text-muted-foreground"
                  onClick={() => sigRef.current?.clear()}
                >
                  Borrar firma
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer con navegacion */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex justify-between gap-3">
          {step !== "tipo" ? (
            <Button
              variant="outline"
              onClick={() => setStep(STEPS[stepIndex - 1])}
              disabled={saving}
            >
              Anterior
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === "tipo" && (
            <span className="text-xs text-muted-foreground self-center">
              Selecciona un tipo para continuar
            </span>
          )}

          {step === "datos" && (
            <Button
              className="cta-button"
              onClick={() => setStep("cuestionario")}
              disabled={!canProceedFromDatos}
            >
              Siguiente
            </Button>
          )}

          {step === "cuestionario" && (
            <Button
              className="cta-button"
              onClick={() => setStep("firma")}
              disabled={!canProceedFromCuestionario}
            >
              Siguiente
            </Button>
          )}

          {step === "firma" && (
            <Button
              className="cta-button"
              onClick={handleSubmit}
              disabled={saving || !accepted}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Firmar y guardar"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
