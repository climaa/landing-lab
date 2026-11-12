/**
 * A metrics-strip value read as a number: "1,529" → 1529, "219.5 KB" → 219.5.
 *
 * Text with no digit is refused rather than read. `Number('')` is 0, so a strip
 * cell read while still empty (measuring) or showing "—" (measurement failed)
 * would otherwise pass for a real 0 — failing "the count shown equals the
 * count in the document" by chance, or passing "after is under a tenth of
 * before" when nothing was measured at all.
 */
export function stripNumber(text: string): number {
  const digits = text.replace(/[^\d.]/g, '');
  if (!/\d/.test(digits))
    throw new Error(`strip value ${JSON.stringify(text)} is not a number`);

  return Number(digits);
}
