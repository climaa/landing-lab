import type { Pro } from '@/data/garden-designers';
import type { Variant } from '@/lib/seo';
import { Avatar } from './Avatar';
import { Stars } from './Stars';

/** One business in the category list: who, where, how rated, where to go next. */
export function ProCard({
  pro,
  variant,
  href,
}: {
  pro: Pro;
  variant: Variant;
  href: string;
}) {
  return (
    <article className="lab-card lab-pro" id={pro.id}>
      <header className="lab-who">
        <Avatar variant={variant} initials={pro.initials} />
        <div>
          <h3 className="lab-pro__name">{pro.name}</h3>
          <p className="lab-muted">
            {pro.town} · {pro.yearsTrading} years trading
          </p>
        </div>
      </header>
      <p className="lab-rating">
        <strong>{pro.rating.toFixed(1)}</strong>
        <Stars variant={variant} value={pro.rating} />
        <span className="lab-muted">({pro.reviews.length} reviews)</span>
      </p>
      <a className="lab-link" href={href}>
        View profile
      </a>
    </article>
  );
}
