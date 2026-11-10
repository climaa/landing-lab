import type { Review } from '@/data/garden-designers';
import type { Variant } from '@/lib/seo';
import { Avatar } from './Avatar';
import { Stars } from './Stars';

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** One review: who wrote it, when, the score and the words. */
export function ReviewCard({ review, variant }: { review: Review; variant: Variant }) {
  return (
    <article className="lab-card lab-review">
      <header className="lab-who">
        <Avatar variant={variant} initials={review.initials} />
        <div>
          <p className="lab-review__author">{review.author}</p>
          <time className="lab-muted lab-small" dateTime={review.date}>
            {DATE.format(new Date(`${review.date}T00:00:00Z`))}
          </time>
        </div>
      </header>
      <Stars variant={variant} value={review.rating} />
      <p>{review.body}</p>
    </article>
  );
}
