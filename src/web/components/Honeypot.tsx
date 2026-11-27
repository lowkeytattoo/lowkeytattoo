import { forwardRef } from "react";

/**
 * Campo trampa contra robots de spam (sin cookies ni servicios de terceros).
 * Invisible para las personas y fuera del orden de tabulación; los robots que
 * rellenan todos los campos lo completan y el envío se descarta en silencio.
 */
export const Honeypot = forwardRef<HTMLInputElement>((_, ref) => (
  <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
    <label>
      Sitio web
      <input ref={ref} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
    </label>
  </div>
));
Honeypot.displayName = "Honeypot";
