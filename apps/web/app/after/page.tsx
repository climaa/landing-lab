import type { Metadata } from 'next';
import { CategoryPage } from '@/lib/category-page';

export const metadata: Metadata = { title: 'Garden designers near you' };

/** The fixed page: one rating image per rating, one canonical, reciprocal alternates. */
export default function AfterPage() {
  return <CategoryPage variant="after" path="/after" />;
}
