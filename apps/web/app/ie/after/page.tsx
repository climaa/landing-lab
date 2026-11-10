import type { Metadata } from 'next';
import { CategoryPage } from '@/lib/category-page';

export const metadata: Metadata = { title: 'Garden designers near you' };

/** The same page for Ireland: its own canonical, and the same three alternates. */
export default function IrishAfterPage() {
  return <CategoryPage variant="after" path="/ie/after" lang="en-IE" />;
}
