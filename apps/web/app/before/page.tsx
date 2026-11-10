import type { Metadata } from 'next';
import { CategoryPage } from '@/lib/category-page';

/** Kept out of real search results: it is broken on purpose. */
export const metadata: Metadata = {
  title: 'Garden designers near you (before)',
  robots: { index: false, follow: true },
};

/**
 * The antipattern, kept on purpose and measured against /after: five star
 * images per rating with no alt, avatar images with no alt, a link to an
 * address that is not canonical, `en-GB` declared twice, and JSON-LD that does
 * not parse.
 */
export default function BeforePage() {
  return <CategoryPage variant="before" path="/before" />;
}
