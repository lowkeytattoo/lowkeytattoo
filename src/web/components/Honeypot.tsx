import { forwardRef } from "react";

/**
 * Campo trampa contra robots de spam (sin cookies ni servicios de terceros).
 * Invisible para las personas y fuera del orden de tabulación; los robots que
 * rellenan todos los campos lo completan y el envío se descarta en silencio.
 */
export const Honeypot = forwardRef<HTMLInputElement>((_, ref) => (
  <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
    {/* Nombre sin significado para que ningún autocompletado lo rellene a una persona real */}
    <label>
      No rellenar
      <input ref={ref} type="text" name="lk_hp_7q" tabIndex={-1} autoComplete="off" data-1p-ignore data-lpignore="true" defaultValue="" />
    </label>
  </div>
));
Honeypot.displayName = "Honeypot";
