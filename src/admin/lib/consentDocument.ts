import jsPDF from "jspdf";
import { format } from "date-fns";
import { ARTISTS, type Artist } from "@shared/config/artists";
import type { Client, ConsentFormType, ConsentFormData, ConsentImagePermissions } from "@shared/types/index";
import { CONTACT } from "@web/config/contact";
import { PIRATA_ONE_B64 } from "@admin/lib/pirataOneFont";

// ═══════════════════════════════════════════════════════════════════════════
// Consentimiento informado — textos, cuestionarios y PDF (plantilla 2.0)
//
// Plantilla 2.1 (28/11/2026): LEGAL_TEXT, HEALTH_TEXT y MINOR_TEXT redactados
// con criterio de asesoría a petición del titular. ⚠️ PENDIENTES DE
// VERIFICACIÓN PROFESIONAL: cotejo con anexos VI/VII del Decreto 154/2004,
// régimen sanitario del láser (V-02) y entrega obligatoria de copia.
// Al cambiar cualquier texto o pregunta, subir CONSENT_TEMPLATE_VERSION:
// los documentos firmados conservan su versión.
// ═══════════════════════════════════════════════════════════════════════════

export const CONSENT_TEMPLATE_VERSION = "2.1";

// ─── Cuestionarios por tipo ──────────────────────────────────────────────────

export const TATTOO_QUESTIONS = [
  "¿Tiene o ha tenido enfermedades de la piel (psoriasis, eccema, vitíligo, queloides)?",
  "¿Padece trastornos de la coagulación o hemorragias?",
  "¿Es diabético/a?",
  "¿Tiene VIH, hepatitis u otras enfermedades de transmisión sanguínea?",
  "¿Padece enfermedades cardíacas o lleva marcapasos?",
  "¿Tiene el sistema inmunitario comprometido?",
  "¿Toma anticoagulantes, aspirina u otros antiinflamatorios?",
  "¿Toma isotretinoína (Roacután) actualmente o en los últimos 6 meses?",
  "¿Es alérgico/a a algún medicamento, tinte o material?",
  "¿Está embarazada o en periodo de lactancia?",
  "¿Ha consumido alcohol o drogas en las últimas 24 horas?",
  "¿Tiene heridas, infecciones o irritación en la zona a tatuar?",
  "¿Ha tenido reacciones adversas a tatuajes anteriores?",
];

export const PIERCING_QUESTIONS = [
  "¿Tiene tendencia a formar queloides o cicatrices elevadas?",
  "¿Padece diabetes o alguna enfermedad que ralentice la cicatrización?",
  "¿Tiene alguna alteración del sistema inmunitario?",
  "¿Toma anticoagulantes, aspirina o antiinflamatorios?",
  "¿Es alérgico/a a metales (níquel, cobalto, cromo)?",
  "¿Es alérgico/a al látex u otro material?",
  "¿Tiene VIH, hepatitis u otras enfermedades de transmisión sanguínea?",
  "¿Tiene enfermedades cardíacas o lleva prótesis valvular?",
  "¿Está embarazada o en periodo de lactancia?",
  "¿Ha consumido alcohol o drogas en las últimas 24 horas?",
  "¿Tiene infección, herida o irritación en la zona a perforar?",
  "¿Tiene antecedentes de rechazo a piercings anteriores?",
  "¿Lleva prótesis metálicas, marcapasos u otros implantes?",
  "¿Está tomando algún medicamento actualmente?",
];

export const LASER_QUESTIONS = [
  "¿Está embarazada o en periodo de lactancia?",
  "¿Tiene o ha tenido cáncer de piel?",
  "¿Tiene lesiones sospechosas o lunares en la zona a tratar?",
  "¿Padece epilepsia fotosensible?",
  "¿Tiene tendencia a formar queloides o cicatrices hipertróficas?",
  "¿Ha tomado isotretinoína en los últimos 6 meses?",
  "¿Toma medicamentos fotosensibilizantes (antibióticos, diuréticos, antidepresivos)?",
  "¿Toma anticoagulantes?",
  "¿Padece diabetes o alguna enfermedad que ralentice la cicatrización?",
  "¿Tiene el sistema inmunitario comprometido?",
  "¿Tiene vitíligo, psoriasis u otras enfermedades cutáneas activas?",
  "¿Ha tenido herpes recurrente en la zona a tratar?",
  "¿Se ha expuesto al sol o a cabinas de bronceado en las últimas 4 semanas?",
  "¿Tiene tatuajes de henna negra o pigmentos metálicos en la zona?",
  "¿Lleva implantes metálicos o marcapasos cerca de la zona?",
  "¿Ha recibido tratamientos con ácidos o peelings en los últimos 30 días?",
  "¿Ha recibido rellenos con ácido hialurónico en la zona?",
];

export const QUESTIONS: Record<ConsentFormType, string[]> = {
  tattoo: TATTOO_QUESTIONS,
  piercing: PIERCING_QUESTIONS,
  laser: LASER_QUESTIONS,
};

export const TYPE_LABEL: Record<ConsentFormType, string> = {
  tattoo: "Tatuaje",
  piercing: "Piercing",
  laser: "Láser",
};

// Normativa sanitaria aplicable. Tatuaje y piercing: Decreto canario 154/2004
// (registro y consentimiento, anexos VI y VII). Láser: régimen pendiente de
// validar con el asesor (V-02); no se cita norma hasta entonces.
export const NORM_REF: Record<ConsentFormType, string> = {
  tattoo: "Decreto 154/2004 de Canarias · Reglamento de establecimientos de tatuaje, micropigmentación y piercing",
  piercing: "Decreto 154/2004 de Canarias · Reglamento de establecimientos de tatuaje, micropigmentación y piercing",
  laser: "",
};

export const PHOTOTYPES = ["I", "II", "III", "IV", "V", "VI"];

export const LEGAL_TEXT: Record<ConsentFormType, string> = {
  tattoo:
    "He sido informado/a de forma clara y comprensible sobre el tatuaje que se me va a realizar. Consiste en introducir pigmentos en la piel con agujas estériles de un solo uso y material esterilizado o desechable, y su resultado es permanente: eliminarlo después requiere tratamientos largos, costosos y no siempre completos. " +
    "Conozco sus riesgos y posibles complicaciones: dolor, inflamación y enrojecimiento pasajeros; infección local; reacción alérgica a los pigmentos, que puede aparecer incluso años después; cicatrización anómala o queloides; y pérdida o alteración del color. El resultado puede variar según mi tipo de piel y los cuidados que siga. " +
    "He respondido con veracidad al cuestionario de salud y sé que ocultar información aumenta estos riesgos. Me comprometo a seguir las instrucciones de cuidado y a consultar a un profesional sanitario ante signos de infección o reacción (fiebre, dolor intenso, supuración o enrojecimiento que se extiende). " +
    "He podido hacer todas las preguntas que he considerado necesarias. Presto mi consentimiento de forma libre y voluntaria y sé que puedo revocarlo en cualquier momento antes de que comience el procedimiento.",
  piercing:
    "He sido informado/a de forma clara y comprensible sobre el piercing que se me va a realizar. Consiste en perforar la piel o el tejido con una aguja estéril de un solo uso y colocar una joya de material apto para perforaciones. Si más adelante retiro la joya, puede quedar una pequeña cicatriz permanente. " +
    "Conozco sus riesgos y posibles complicaciones: dolor, sangrado e inflamación pasajeros; infección; rechazo o desplazamiento de la joya; queloides o cicatrices elevadas; y reacción alérgica al metal. Según la zona puede haber riesgos específicos (en el cartílago la cicatrización es más lenta; en la boca, posibles daños en dientes y encías). La cicatrización puede durar de semanas a varios meses. " +
    "He respondido con veracidad al cuestionario de salud. Me comprometo a seguir las instrucciones de cuidado, a no manipular ni cambiar la joya antes de la cicatrización completa y a consultar a un profesional sanitario ante signos de infección. " +
    "He podido hacer todas las preguntas que he considerado necesarias. Presto mi consentimiento de forma libre y voluntaria y sé que puedo revocarlo en cualquier momento antes de que comience el procedimiento.",
  laser:
    "He sido informado/a de que la eliminación de tatuajes con láser consiste en aplicar pulsos de luz de alta energía que fragmentan el pigmento para que el organismo lo elimine poco a poco. Normalmente hacen falta varias sesiones, separadas varias semanas, y no se puede garantizar la eliminación completa: depende de los colores, la profundidad y la antigüedad del tatuaje, de mi tipo de piel y de mi respuesta individual. Algunos colores (blancos, rosados o tonos piel) pueden oscurecerse. " +
    "Conozco los riesgos: dolor durante la sesión; enrojecimiento, inflamación, ampollas, costras o pequeños sangrados pasajeros; aclaramiento u oscurecimiento de la piel, que puede durar meses o ser permanente; cambios en la textura de la piel o cicatrices; infección; y, excepcionalmente, reacciones alérgicas. Durante la sesión debo llevar la protección ocular que se me indique. " +
    "Me comprometo a evitar el sol y las cabinas de bronceado en la zona, usar protección solar, no rascar ni arrancar las costras, seguir las instrucciones de cuidado y comunicar antes de cada sesión cualquier cambio en mi salud o medicación. He respondido con veracidad al cuestionario de salud. " +
    "He podido hacer todas las preguntas que he considerado necesarias. Presto mi consentimiento de forma libre y voluntaria y sé que puedo revocarlo en cualquier momento antes de que comience cada sesión.",
};

// Redactado 28/11/2026, pendiente de verificación profesional (V-01): declaración explícita
// para el tratamiento de datos de salud (art. 9.2.a RGPD).
export const HEALTH_TEXT =
  "Para valorar si el procedimiento puede realizarse con seguridad es necesario tratar los datos de salud que indico en el cuestionario. " +
  "Autorizo expresamente a Pablo Matos Rodríguez (Lowkey Tattoo) a tratarlos con esa única finalidad y para documentar la intervención conforme a la normativa sanitaria. " +
  "Solo podrán consultarlos los titulares del estudio y el artista que me atienda; no se usarán para otros fines ni se cederán a terceros salvo obligación legal. " +
  "Puedo retirar esta autorización, pero sin ella no es posible realizar el procedimiento. La retirada no afecta a lo ya realizado, y el documento firmado se conservará con acceso restringido durante el plazo legal (al menos 5 años desde la intervención), para cumplir la normativa sanitaria y, en su caso, atender reclamaciones.";

export const CARE_TEXT = "He recibido las instrucciones de cuidado posteriores al procedimiento.";

// Redactado 28/11/2026, pendiente de verificación profesional (V-03): autorización del representante.
export const MINOR_TEXT =
  "Declaro que soy padre, madre o tutor/a legal del menor que figura en este documento, que ejerzo su representación legal y que he acreditado esta condición ante el estudio. " +
  "Declaro también que actúo con el conocimiento y la conformidad del otro progenitor o representante legal, si lo hubiera, o que ejerzo la representación en exclusiva. " +
  "He estado presente, he recibido la información sobre el procedimiento, sus riesgos y los cuidados posteriores, y he podido resolver mis dudas. El menor también ha sido informado y está de acuerdo. " +
  "Autorizo expresamente la realización del procedimiento y el tratamiento de sus datos, incluidos los de salud, con las finalidades indicadas en este documento.";

// Mismo texto en pantalla y en el PDF; coherente con la política de privacidad.
export const rgpdText = (type: ConsentFormType) =>
  "Responsable: Pablo Matos Rodríguez (Lowkey Tattoo), NIF 54050691R, Calle Dr. Allart 50, 38003 Santa Cruz de Tenerife. " +
  "Finalidad: valorar si el procedimiento puede realizarse con seguridad, documentar la intervención y cumplir la normativa sanitaria. " +
  "Sus datos, incluidos los de salud, solo los consultan los titulares del estudio y el artista que le atiende, y no se ceden a terceros salvo obligación legal. " +
  (type === "laser"
    ? "Conservación: durante el plazo que exija la normativa aplicable y, como mínimo, 5 años desde esta intervención. "
    : "Conservación: al menos 5 años desde esta intervención (Decreto 154/2004 de Canarias). ") +
  "Las autorizaciones de imagen son voluntarias y puede retirarlas en cualquier momento. " +
  "Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad en info@tattoolowkey.com y reclamar ante la AEPD (www.aepd.es). " +
  "Más información: tattoolowkey.com/politica-de-privacidad.";

export const imageOptions = (artist: Artist): { key: keyof ConsentImagePermissions; label: string }[] => [
  { key: "internal", label: "Fotografías del trabajo para mi ficha y su seguimiento en el estudio (uso interno)." },
  { key: "studioWeb", label: "Publicar fotografías del trabajo en la web de Lowkey Tattoo (tattoolowkey.com)." },
  { key: "studioSocial", label: "Publicar fotografías del trabajo en las redes sociales de Lowkey Tattoo (Instagram y Facebook)." },
  { key: "artistPortfolio", label: `Que ${artist.name} conserve fotografías del trabajo en su portfolio profesional.` },
  { key: "artistSocial", label: `Que ${artist.name} publique fotografías del trabajo en sus redes sociales (${artist.handle}).` },
];

export const NO_IMAGE: ConsentImagePermissions = {
  internal: false, studioWeb: false, studioSocial: false, artistPortfolio: false, artistSocial: false,
};

// ─── Utilidades ──────────────────────────────────────────────────────────────

export async function sha256Hex(blob: Blob): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new Uint8Array(await blob.arrayBuffer()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reduce la foto del documento (máx. 1600 px, JPEG) antes de subirla. */
export async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la foto"))), "image/jpeg", 0.8),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const fmtDate = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "—");

// ─── Generación del PDF ──────────────────────────────────────────────────────

export interface PdfParams {
  formType: ConsentFormType;
  client: Pick<Client, "name" | "phone" | "email">;
  formData: ConsentFormData;
  signatures: { client: string; tutor: string | null; applicator: string };
  signedAt: Date;
  formId: string;
  replacesId: string | null;
}

export function buildPdf(p: PdfParams): Blob {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.addFileToVFS("PirataOne.ttf", PIRATA_ONE_B64);
  pdf.addFont("PirataOne.ttf", "PirataOne", "normal");

  const fd = p.formData;
  const W = 210, H = 297;
  const ml = 14, mr = 14;
  const tw = W - ml - mr;
  let y = 0;

  const np = (need = 6) => {
    if (y + need > H - 14) { pdf.addPage(); y = 16; }
  };
  const h2 = (t: string) => {
    np(10);
    pdf.setFontSize(8.5).setFont("helvetica", "bold").setTextColor(0, 0, 0);
    pdf.text(t, ml, y);
    y += 5.5;
  };
  const body = (t: string, x = ml, maxW = tw, size = 8) => {
    pdf.setFontSize(size).setFont("helvetica", "normal").setTextColor(0, 0, 0);
    const lines = pdf.splitTextToSize(t, maxW);
    np(lines.length * 4.2);
    pdf.text(lines, x, y);
    y += lines.length * 4.2;
  };
  const kv = (k: string, v: string) => {
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(v || "—", tw - 38);
    np(lines.length * 4.2);
    pdf.setFont("helvetica", "bold").text(k, ml, y);
    pdf.setFont("helvetica", "normal").text(lines, ml + 38, y);
    y += lines.length * 4.2;
  };
  const check = (ok: boolean, t: string) => {
    pdf.setFontSize(8);
    const lines = pdf.splitTextToSize(t, tw - 14);
    np(lines.length * 4.2 + 1);
    pdf.setFont("helvetica", "bold").setTextColor(ok ? 20 : 170, ok ? 120 : 40, ok ? 20 : 40);
    pdf.text(ok ? "SÍ" : "NO", ml, y);
    pdf.setFont("helvetica", "normal").setTextColor(0, 0, 0);
    pdf.text(lines, ml + 10, y);
    y += lines.length * 4.2 + 1;
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

  // ── Cabecera ──
  const hdrH = 28;
  pdf.setFillColor(18, 18, 18);
  pdf.rect(0, 0, W, hdrH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18).setFont("PirataOne", "normal");
  pdf.text("Lowkey Tattoo Tenerife", ml, 14);
  pdf.setFontSize(7).setFont("helvetica", "normal").setTextColor(200, 200, 200);
  pdf.text(`Pablo Matos Rodríguez · NIF 54050691R · ${CONTACT.address}`, ml, 20);
  pdf.text(`${CONTACT.phonePretty}  ·  ${CONTACT.website}  ·  ${CONTACT.email}`, ml, 25);
  pdf.setTextColor(0, 0, 0);
  y = hdrH + 6;

  // ── Título ──
  pdf.setFontSize(11).setFont("helvetica", "bold");
  pdf.text(`CONSENTIMIENTO INFORMADO — ${TYPE_LABEL[p.formType].toUpperCase()}`, ml, y);
  y += 5.5;
  if (NORM_REF[p.formType]) {
    pdf.setFontSize(7).setFont("helvetica", "normal").setTextColor(130, 130, 130);
    pdf.text(NORM_REF[p.formType], ml, y);
    pdf.setTextColor(0, 0, 0);
  }
  y += 6;
  hr(4);

  // ── Intervención ──
  h2("INTERVENCIÓN");
  kv("Fecha", format(p.signedAt, "dd/MM/yyyy"));
  kv("Zona", fd.procedure?.zone ?? "");
  if (fd.procedure?.description) kv("Descripción", fd.procedure.description);
  if (fd.procedure?.sessionDate) kv("Sesión", fmtDate(fd.procedure.sessionDate));
  if (fd.laser) {
    kv("Fototipo", fd.laser.phototype);
    if (fd.laser.sessionNumber) kv("Nº de sesión", fd.laser.sessionNumber);
    if (fd.laser.pigmentColors) kv("Colores", fd.laser.pigmentColors);
    if (fd.laser.parameters) kv("Parámetros", fd.laser.parameters);
  }
  y += 2;
  hr(5);

  // ── Aplicador | Cliente ──
  const colW = (tw - 6) / 2;
  const col2 = ml + colW + 6;
  let yL = y, yR = y;
  colLabel("APLICADOR / PROFESIONAL RESPONSABLE", ml);
  yL += 4.5;
  pdf.setFontSize(9).setFont("helvetica", "bold");
  pdf.text(fd.applicator?.name ?? fd.artistName, ml, yL); yL += 5;
  pdf.setFontSize(8).setFont("helvetica", "normal");
  pdf.text(`DNI/NIE: ${fd.applicator?.nif || "—"}`, ml, yL); yL += 4.5;
  if (fd.applicator?.sanitaryCert) {
    const certLines = pdf.splitTextToSize(`Cert. higiénico-sanitario: ${fd.applicator.sanitaryCert}`, colW);
    pdf.text(certLines, ml, yL); yL += certLines.length * 4.5;
  }

  colLabel("CLIENTE", col2);
  yR += 4.5;
  pdf.setFontSize(9).setFont("helvetica", "bold");
  pdf.text(p.client.name, col2, yR); yR += 5;
  pdf.setFontSize(8).setFont("helvetica", "normal");
  pdf.text(`DNI/NIE/Pasaporte: ${fd.clientDni || "—"}`, col2, yR); yR += 4.5;
  if (fd.client) { pdf.text(`Nacimiento: ${fmtDate(fd.client.birthDate)} (${fd.client.ageAtSigning} años)`, col2, yR); yR += 4.5; }
  if (p.client.phone) { pdf.text(`Tel: ${p.client.phone}`, col2, yR); yR += 4.5; }
  if (p.client.email) {
    const emailLines = pdf.splitTextToSize(`Email: ${p.client.email}`, colW);
    pdf.text(emailLines, col2, yR); yR += emailLines.length * 4.5;
  }
  y = Math.max(yL, yR) + 4;
  hr(5);

  // ── Representante ──
  if (fd.minor) {
    h2("REPRESENTANTE LEGAL (CLIENTE MENOR DE EDAD)");
    kv("Nombre", fd.minor.tutorName);
    kv("Relación", fd.minor.tutorRelation);
    kv("DNI/NIE", fd.minor.tutorDni);
    kv("Comprobación", `Documento y representación comprobados por ${fd.minor.verifiedBy}` +
      (fd.minor.documentPhotoPath ? ". Copia del documento archivada aparte (no incluida en este PDF)." : "."));
    y += 1;
    body(MINOR_TEXT);
    y += 2;
    hr(5);
  }

  // ── Cuestionario ──
  h2("CUESTIONARIO DE SALUD PREVIO");
  fd.questionnaire.forEach((item) => {
    pdf.setFontSize(8);
    const qLines = pdf.splitTextToSize(item.q, tw - 14);
    np(qLines.length * 4.2 + 1);
    pdf.setFont("helvetica", "normal").setTextColor(0, 0, 0);
    pdf.text(qLines, ml + 2, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(item.a ? 180 : 40, item.a ? 40 : 140, 0);
    pdf.text(item.a ? "SÍ" : "NO", W - mr - 7, y);
    pdf.setTextColor(0, 0, 0);
    y += qLines.length * 4.2 + 1;
    if (item.a && item.detail) {
      pdf.setFont("helvetica", "italic").setFontSize(7.5);
      const dLines = pdf.splitTextToSize(`Aclaración: ${item.detail}`, tw - 20);
      np(dLines.length * 3.9 + 1);
      pdf.text(dLines, ml + 6, y);
      y += dLines.length * 3.9 + 1;
    }
  });
  if (fd.additionalInfo) {
    y += 2;
    h2("OBSERVACIONES");
    body(fd.additionalInfo);
  }
  y += 3;
  hr(5);

  // ── Consentimientos ──
  h2("INFORMACIÓN Y CONSENTIMIENTO DEL PROCEDIMIENTO");
  body(LEGAL_TEXT[p.formType]);
  y += 2;
  check(!!fd.consents?.procedure, "Acepta la realización del procedimiento tras haber sido informado/a.");
  check(!!fd.consents?.careInstructions, CARE_TEXT);
  y += 2;
  h2("TRATAMIENTO DE DATOS DE SALUD");
  body(HEALTH_TEXT);
  y += 2;
  check(!!fd.consents?.healthData, "Presta su consentimiento explícito para el tratamiento de sus datos de salud.");
  y += 2;
  h2("AUTORIZACIONES DE IMAGEN (VOLUNTARIAS)");
  const image = fd.consents?.image ?? NO_IMAGE;
  const artistForLabels = ARTISTS.find((a) => a.id === fd.applicator?.artistId) ?? ARTISTS[0];
  imageOptions(artistForLabels).forEach((o) => check(image[o.key], o.label));
  y += 1;
  body("Negarse a estas autorizaciones no afecta al servicio. Pueden retirarse en cualquier momento en info@tattoolowkey.com.", ml, tw, 7.5);
  y += 3;

  pdf.setFontSize(8).setFont("helvetica", "bold").setTextColor(80, 80, 80);
  np(8);
  pdf.text("PROTECCIÓN DE DATOS", ml, y); y += 4.5;
  pdf.setFont("helvetica", "normal").setFontSize(7.5);
  const rgpdLines = pdf.splitTextToSize(rgpdText(p.formType), tw);
  np(rgpdLines.length * 3.8);
  pdf.text(rgpdLines, ml, y);
  pdf.setTextColor(0, 0, 0);
  y += rgpdLines.length * 3.8 + 5;
  hr(5);

  // ── Firmas ──
  const boxes: { label: string; name: string; img: string }[] = [
    { label: "FIRMA DEL CLIENTE", name: p.client.name, img: p.signatures.client },
  ];
  if (p.signatures.tutor && fd.minor) boxes.push({ label: "FIRMA DEL REPRESENTANTE", name: fd.minor.tutorName, img: p.signatures.tutor });
  boxes.push({ label: "FIRMA DEL APLICADOR", name: fd.applicator?.name ?? fd.artistName, img: p.signatures.applicator });

  const sigH = 30;
  const gap = 5;
  const boxW = (tw - gap * (boxes.length - 1)) / boxes.length;
  np(sigH + 26);
  boxes.forEach((b, i) => {
    const x = ml + i * (boxW + gap);
    pdf.setFontSize(7).setFont("helvetica", "bold").setTextColor(120, 120, 120);
    pdf.text(b.label, x, y);
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(x, y + 2, boxW, sigH);
    try {
      pdf.addImage(b.img, "PNG", x + 1.5, y + 3.5, boxW - 3, sigH - 3, "", "FAST");
    } catch {
      /* firma ilegible: se deja el recuadro vacío */
    }
    pdf.setFontSize(7.5).setFont("helvetica", "normal").setTextColor(0, 0, 0);
    pdf.text(pdf.splitTextToSize(b.name, boxW), x, y + sigH + 6);
  });
  y += sigH + 12;

  pdf.setFontSize(8).setFont("helvetica", "normal");
  np(14);
  pdf.text(`Fecha y hora de firma (servidor): ${format(p.signedAt, "dd/MM/yyyy  HH:mm:ss")}`, ml, y); y += 4.5;
  pdf.setFontSize(7).setTextColor(130, 130, 130);
  pdf.text(`Documento: ${p.formId}`, ml, y); y += 4;
  if (p.replacesId) { pdf.text(`Sustituye al documento anulado: ${p.replacesId}`, ml, y); y += 4; }
  pdf.setTextColor(0, 0, 0);

  // ── Pie ──
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7).setTextColor(170, 170, 170);
    pdf.text(
      `Lowkey Tattoo  ·  Plantilla v${CONSENT_TEMPLATE_VERSION}  ·  Documento ${p.formId.slice(0, 8)}  ·  ${format(p.signedAt, "dd/MM/yyyy HH:mm:ss")}`,
      ml, H - 8,
    );
    pdf.text(`${i} / ${pageCount}`, W - mr - 8, H - 8);
    pdf.setTextColor(0, 0, 0);
  }

  return pdf.output("blob");
}

