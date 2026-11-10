import { drawnValue } from '@lab/ui';

/**
 * The antipattern the lab exists to fix, kept faithfully: one `<img>` per star,
 * five per rating, with no `alt` — so a screen reader announces five unlabelled
 * images, or a file name, and never the score.
 *
 * Rounded exactly as RatingStars rounds, so the two variants draw the same
 * stars and differ only in how they are built.
 */
export function BeforeStars({ value }: { value: number }) {
  const drawn = drawnValue(value);

  return (
    <span className="lab-before-stars">
      {[0, 1, 2, 3, 4].map((index) => {
        const fill =
          drawn - index >= 1 ? 'full' : drawn - index >= 0.5 ? 'half' : 'empty';

        return (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- the missing alt IS the before page
          <img key={index} src={`/before/star-${fill}.png`} width={16} height={16} />
        );
      })}
    </span>
  );
}
