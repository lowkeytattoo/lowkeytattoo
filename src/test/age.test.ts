import { describe, it, expect } from "vitest";
import { ageOn } from "@admin/lib/age";

const on = (iso: string) => new Date(`${iso}T12:00:00`);

describe("ageOn (edad para consentimientos)", () => {
  it("cumple años el mismo día", () => {
    expect(ageOn("2010-11-28", on("2026-11-28"))).toBe(16);
  });
  it("el día antes del cumpleaños aún tiene un año menos", () => {
    expect(ageOn("2010-11-28", on("2026-11-27"))).toBe(15);
  });
  it("menor de 16 → 15", () => {
    expect(ageOn("2011-01-01", on("2026-11-28"))).toBe(15);
  });
  it("17 años sigue siendo menor", () => {
    expect(ageOn("2009-06-15", on("2026-11-28"))).toBe(17);
  });
  it("18 años el día del cumpleaños", () => {
    expect(ageOn("2008-11-28", on("2026-11-28"))).toBe(18);
  });
  it("29 de febrero", () => {
    expect(ageOn("2008-02-29", on("2026-02-28"))).toBe(17);
    expect(ageOn("2008-02-29", on("2026-03-01"))).toBe(18);
  });
  it("fechas no válidas", () => {
    expect(ageOn("", on("2026-11-28"))).toBeNull();
    expect(ageOn("28/11/2010", on("2026-11-28"))).toBeNull();
    expect(ageOn("2030-01-01", on("2026-11-28"))).toBeNull();
    expect(ageOn("2010-13-01", on("2026-11-28"))).toBeNull();
  });
});
