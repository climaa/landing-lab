/**
 * The part of `@lab/seo-guard` this app calls. The package is JSDoc-typed `.mjs`
 * and ships no declarations, so the contract is written here by hand, as the
 * console does for the differ (apps/visual-diff-ui/types/visual-diff/).
 */
declare module '@lab/seo-guard' {
  export interface Finding {
    rule: string;
    severity: 'error' | 'warning';
    message: string;
    evidence: string;
  }

  export interface PageReport {
    url: string;
    status: number;
    canonical: string | null;
    hreflang: { lang: string; href: string }[];
    jsonLdTypes: string[];
    findings: Finding[];
  }

  export interface Report {
    version: 1;
    origin: string;
    pages: PageReport[];
    summary: { pages: number; errors: number; warnings: number };
  }

  export function check(options: {
    urls?: string[];
    sitemap?: string;
    origin?: string;
    maxPages?: number;
    fetchImpl?: typeof fetch;
  }): Promise<Report>;

  export class GuardError extends Error {}
}
