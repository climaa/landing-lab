export type RatingStarsSize = 'sm' | 'md' | 'lg';

export interface RatingStarsProps {
  /** The score, 0–5. Clamped; a value that is not finite reads "No rating". */
  value: number;
  /** Replaces the accessible name, which is otherwise `Rated {score} out of 5`. */
  label?: string;
  /** The type step the stars are sized from: --text-sm, --text-base, --text-lg. */
  size?: RatingStarsSize;
  className?: string;
}

const MAX = 5;

/**
 * The score as drawn: clamped, then rounded to the nearest half, ties up.
 * Exported so a page that draws stars some other way rounds them identically.
 */
export function drawnValue(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.round(Math.min(Math.max(value, 0), MAX) * 2) / 2;
}

/** The score as spoken: clamped, one decimal, a trailing `.0` dropped. */
function spokenValue(value: number): string {
  return String(Number(Math.min(Math.max(value, 0), MAX).toFixed(1)));
}

/**
 * A 0–5 rating, drawn as five stars, read as one image with its score.
 *
 * One element and no children, on purpose: a page that draws each star as its
 * own `<img>` spends five or six nodes per rating and tells a screen reader
 * nothing, and an inline SVG with a path per star would still cost about sixteen.
 * The stars are a mask over a two-colour fill (RatingStars.css), so the score
 * lives in one `data-value` attribute and one accessible name.
 *
 * The drawing rounds to the nearest half star; the name does not round past one
 * decimal, so it never claims the approximation the stars had to make.
 */
export function RatingStars({ value, label, size = 'md', className }: RatingStarsProps) {
  const name =
    label ??
    (Number.isFinite(value) ? `Rated ${spokenValue(value)} out of ${MAX}` : 'No rating');

  return (
    <span
      className={['ds-rating-stars', `ds-rating-stars--${size}`, className]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={name}
      data-value={String(drawnValue(value))}
    />
  );
}
