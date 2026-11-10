import type { MetadataRoute } from 'next';
import { ALTERNATES } from '@/lib/site';
import { absolute } from '@/lib/site';

/** The indexable pages: the fixed category page and its Irish alternate. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [ALTERNATES['en-GB'], ALTERNATES['en-IE']].map((path) => ({
    url: absolute(path),
  }));
}
