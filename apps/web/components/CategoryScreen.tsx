import { SiteFooter, SiteHeader } from '@lab/ui';
import NextLink from 'next/link';
import type { Category } from '@/data/garden-designers';
import type { Variant } from '@/lib/seo';
import { ProCard } from './ProCard';
import { ReviewCard } from './ReviewCard';

export interface CategoryScreenProps {
  category: Category;
  variant: Variant;
  /** The page's own path, which its in-page links point back into. */
  path: string;
  /** Set on the en-IE alternate; the root layout's `<html>` stays en-GB. */
  lang?: string;
}

const NAV = [
  { label: 'Find a pro', href: '/after#pros' },
  { label: 'How it works', href: '/after#reviews' },
  { label: 'Join as a pro', href: '/after#join' },
];

/**
 * The category page, either variant. One tree for both: only the two leaves a
 * rating and an avatar draw differ (Stars, Avatar), plus where "See all garden
 * designers" points — the before page links an old address whose canonical is
 * the fixed page, which is the non-canonical link the audited page carried.
 *
 * Draws from props and reads nothing, so a screen story renders it as the route
 * does (designs/STANDARD.md, screens rule 5).
 */
export function CategoryScreen({ category, variant, path, lang }: CategoryScreenProps) {
  const seeAll = variant === 'before' ? '/garden-designers' : '/after#pros';

  return (
    <>
      <SiteHeader brand={category.brand} brandHref="/after" nav={NAV} as={NextLink} />
      <main id="main" className="lab-page" lang={lang}>
        <section className="lab-hero">
          <h1>{category.title}</h1>
          <label className="ds-visually-hidden" htmlFor="where">
            Postcode or town
          </label>
          <input id="where" className="lab-search" placeholder="Postcode or town" />
          <a className="lab-link" href={seeAll}>
            See all garden designers
          </a>
        </section>
        <section id="pros" aria-labelledby="pros-title">
          <h2 id="pros-title">Top garden designers</h2>
          <div className="lab-grid">
            {category.pros.map((pro) => (
              <ProCard
                key={pro.id}
                pro={pro}
                variant={variant}
                href={`${path}#${pro.id}`}
              />
            ))}
          </div>
        </section>
        <section id="reviews" aria-labelledby="reviews-title">
          <h2 id="reviews-title">Recent reviews</h2>
          <div className="lab-grid">
            {category.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} variant={variant} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter
        copyright={`${category.brand}, a fictional marketplace`}
        year={2026}
        links={[{ label: 'Garden designers', href: '/after' }]}
      />
    </>
  );
}
