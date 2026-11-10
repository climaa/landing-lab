import { type HreflangLink } from './seo';

export interface HeadLinksProps {
  canonical: string;
  alternates?: readonly HreflangLink[];
  jsonLd?: string;
}

/**
 * The page's canonical, its alternates and its structured data, rendered as
 * elements React hoists into <head>. Written out rather than through Next's
 * `metadata.alternates`, which keys languages by name and so cannot repeat one —
 * and repeating one is exactly what the before page must be able to do.
 */
export function HeadLinks({ canonical, alternates = [], jsonLd }: HeadLinksProps) {
  return (
    <>
      <link rel="canonical" href={canonical} />
      {alternates.map(({ hrefLang, href }, index) => (
        <link
          key={`${hrefLang}-${index}`}
          rel="alternate"
          hrefLang={hrefLang}
          href={href}
        />
      ))}
      {jsonLd !== undefined && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}
    </>
  );
}
