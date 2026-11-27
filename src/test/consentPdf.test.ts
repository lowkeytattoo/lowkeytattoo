import { describe, it, expect } from "vitest";
import { buildPdf, QUESTIONS, CONSENT_TEMPLATE_VERSION, sha256Hex } from "@admin/lib/consentDocument";
import type { ConsentFormData, ConsentFormType } from "@shared/types/index";

// jsdom no implementa Blob.text()/arrayBuffer(); en el navegador sí existen.
const read = (blob: Blob, as: "text" | "buffer") =>
  new Promise<string | ArrayBuffer>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string | ArrayBuffer);
    r.onerror = () => reject(r.error);
    if (as === "text") r.readAsText(blob, "latin1"); else r.readAsArrayBuffer(blob);
  });
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () { return read(this, "buffer") as Promise<ArrayBuffer>; };
}

// PNG 1x1 transparente (firma ficticia)
const SIG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function data(type: ConsentFormType, minor: boolean): ConsentFormData {
  return {
    clientDni: "00000000T",
    isMinor: minor,
    questionnaire: QUESTIONS[type].map((q, i) => ({ q, a: i === 0, ...(i === 0 ? { detail: "Aclaración de prueba" } : {}) })),
    additionalInfo: "",
    artistId: "pablo",
    artistName: "Pablo Matos",
    artistNif: "11111111H",
    formType: type,
    templateVersion: CONSENT_TEMPLATE_VERSION,
    procedure: { zone: "Antebrazo", description: "Prueba", sessionId: null, sessionDate: null },
    laser: type === "laser" ? { phototype: "III", sessionNumber: "2", pigmentColors: "negro", parameters: "1064 nm" } : undefined,
    applicator: { artistId: "pablo", name: "Pablo Matos", nif: "11111111H", sanitaryCert: "CERT-1" },
    client: { birthDate: minor ? "2009-06-15" : "1990-01-01", ageAtSigning: minor ? 17 : 36 },
    minor: minor
      ? { tutorName: "Representante Prueba", tutorRelation: "Madre", tutorDni: "22222222J", verified: true, verifiedBy: "Pablo Matos", documentPhotoPath: "c/representante_x.jpg" }
      : null,
    consents: { procedure: true, careInstructions: true, healthData: true, image: { internal: true, studioWeb: false, studioSocial: true, artistPortfolio: false, artistSocial: false } },
    signatures: { client: true, tutor: minor, applicator: true },
  };
}

async function render(type: ConsentFormType, minor: boolean) {
  const blob = buildPdf({
    formType: type,
    client: { name: "Cliente Prueba", phone: "600000000", email: "prueba@example.com" },
    formData: data(type, minor),
    signatures: { client: SIG, tutor: minor ? SIG : null, applicator: SIG },
    signedAt: new Date("2026-11-28T10:00:00Z"),
    formId: "11111111-2222-4333-8444-555555555555",
    replacesId: null,
  });
  // jsPDF no comprime por defecto: el texto es legible en el binario
  const text = (await read(blob, "text")) as string;
  return { blob, text };
}

describe("PDF del consentimiento (plantilla 2.1)", () => {
  it("tatuaje adulto: normativa, aplicador, firmas y sin representante", async () => {
    const { blob, text } = await render("tattoo", false);
    expect(blob.size).toBeGreaterThan(5000);
    expect(text).toContain("Decreto 154/2004");
    expect(text).not.toContain("1088/2009");
    expect(text).toContain("11111111H");
    expect(text).toContain("FIRMA DEL APLICADOR");
    expect(text).not.toContain("FIRMA DEL REPRESENTANTE");
    expect(text).toContain("Plantilla v2.1");
    expect(text).toContain("AUTORIZACIONES DE IMAGEN");
  });

  it("menor: representante y su firma, pero la foto del documento NO va en el PDF", async () => {
    const { text } = await render("piercing", true);
    expect(text).toContain("REPRESENTANTE LEGAL");
    expect(text).toContain("FIRMA DEL REPRESENTANTE");
    expect(text).toContain("22222222J");
    expect(text).not.toContain("representante_x.jpg");
  });

  it("láser: sin cita normativa y con datos técnicos", async () => {
    const { text } = await render("laser", false);
    expect(text).not.toContain("Decreto 154/2004 de Canarias ·");
    expect(text).toContain("Fototipo");
    expect(text).toContain("1064 nm");
  });

  it("la huella SHA-256 es estable y de 64 caracteres", async () => {
    const { blob } = await render("tattoo", false);
    const h1 = await sha256Hex(blob);
    const h2 = await sha256Hex(blob);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).toBe(h2);
  });
});
