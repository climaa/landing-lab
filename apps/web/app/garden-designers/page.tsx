import type { Metadata } from 'next';
import { CategoryPage } from '@/lib/category-page';

export const metadata: Metadata = { title: 'Garden designers near you' };

/**
 * An old address of the category page. It still answers, and names /after as
 * its canonical — which is why a link to it is a link to a non-canonical URL.
 */
export default function OldCategoryAddress() {
  return (
    <CategoryPage
      variant="after"
      path="/garden-designers"
      canonical="/after"
      withAlternates={false}
    />
  );
}
