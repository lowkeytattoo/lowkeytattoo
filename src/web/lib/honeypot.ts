/** true si el campo trampa (Honeypot) se ha rellenado: envío de un robot. */
export const isBot = (el: HTMLInputElement | null) => !!el && el.value.trim().length > 0;
