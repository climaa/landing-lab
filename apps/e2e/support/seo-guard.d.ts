/**
 * The part of `@lab/seo-guard` the acceptance steps call. The package is
 * JSDoc-typed `.mjs` and ships no declarations; apps/web carries the same
 * hand-written contract for its handler.
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

  export function run(
    argv: string[],
    io?: {
      fetchImpl?: typeof fetch;
      stdout?: (text: string) => void;
      stderr?: (text: string) => void;
    },
  ): Promise<0 | 1 | 2>;
}
