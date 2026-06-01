/**
 * Returns the current academic year string in "YYYY-YY" format.
 * Academic year runs August → July.
 * e.g. Aug 2025 – Jul 2026 → "2025-26"
 *      Jan 2026 – Jul 2026 → "2025-26"  (still in 2025-26)
 *      Aug 2026 – Jul 2027 → "2026-27"
 */
export function getCurrentAcademicYear() {
  const now   = new Date();
  const month = now.getMonth(); // 0=Jan … 11=Dec
  const year  = now.getFullYear();
  const startYear = month >= 7 ? year : year - 1; // 7 = August
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}