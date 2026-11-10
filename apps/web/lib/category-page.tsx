import { CategoryScreen } from '@/components/CategoryScreen';
import { CATEGORY } from '@/data/garden-designers';
import { HeadLinks } from './head';
import { hreflangLinks, jsonLdText, type Variant } from './seo';
import { absolute } from './site';

export interface CategoryPageProps {
  variant: Variant;
  /** The path this page is served at. */
  path: string;
  /** The path it names as canonical: its own, except for an old address. */
  canonical?: string;
  /** Whether it declares the language alternates at all. */
  withAlternates?: boolean;
  lang?: string;
}

/** A category route: its head links and structured data, then the screen. */
export function CategoryPage({
  variant,
  path,
  canonical = path,
  withAlternates = true,
  lang,
}: CategoryPageProps) {
  return (
    <>
      <HeadLinks
        canonical={absolute(canonical)}
        alternates={withAlternates ? hreflangLinks(variant) : []}
        jsonLd={jsonLdText(variant, CATEGORY.rating, CATEGORY.reviewCount)}
      />
      <CategoryScreen category={CATEGORY} variant={variant} path={path} lang={lang} />
    </>
  );
}
