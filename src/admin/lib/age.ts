/**
 * Edad cumplida en una fecha. `birthDate` en formato yyyy-MM-dd.
 * Devuelve null si la fecha no es válida o la edad es absurda.
 * Se usa para decidir menores (< 18) y el bloqueo del estudio (< 16).
 */
export function ageOn(birthDate: string, on: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let age = on.getFullYear() - y;
  const beforeBirthday = on.getMonth() + 1 < mo || (on.getMonth() + 1 === mo && on.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
