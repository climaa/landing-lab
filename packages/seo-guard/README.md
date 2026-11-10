# @lab/seo-guard

Reads pages the way a crawler does — `fetch`, no JavaScript — and fails on the
signals that send search engines mixed messages. It never runs a page's scripts, so
it never sends an analytics beacon.

```sh
seo-guard [url ...] [--sitemap <url>] [--origin <url>] [--json] [--max-pages 200]
```

- **Input:** URLs, a sitemap, or both. A sitemap index is followed one level down.
- **Internal** means the `--origin` (default: the first URL's). Internal link targets
  and alternates are fetched once each; external links are never fetched.

## Rules

| id                        | severity | fires when                                                                                                          |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| `canonical-missing`       | error    | no `link[rel=canonical]`                                                                                            |
| `canonical-multiple`      | error    | more than one                                                                                                       |
| `canonical-not-self`      | error    | the canonical is not the page's own normalised URL                                                                  |
| `link-non-canonical`      | error    | an internal `a[href]` whose target names another canonical                                                          |
| `link-redirect`           | warning  | an internal `a[href]` answered with a 3xx                                                                           |
| `hreflang-duplicate`      | error    | the same `hreflang` value twice on one page                                                                         |
| `hreflang-not-reciprocal` | error    | an internal alternate does not list the page back (one finding per page, naming each)                               |
| `hreflang-no-self`        | warning  | alternates are declared, none of them the page itself                                                               |
| `hreflang-invalid`        | error    | not BCP 47 or `x-default`                                                                                           |
| `hreflang-no-x-default`   | warning  | two or more languages and no `x-default`                                                                            |
| `jsonld-invalid`          | error    | an `application/ld+json` block does not parse                                                                       |
| `jsonld-missing-key`      | warning  | `Organization` (name, url), `AggregateRating` (ratingValue, reviewCount or ratingCount), `Service` (name, provider) |

URLs are compared normalised: absolute, lower-case host, no default port, no
fragment, query sorted. A trailing slash is kept as written.

## Output

`--json` prints `{ version: 1, origin, pages: [{ url, status, canonical, hreflang,
jsonLdTypes, findings: [{ rule, severity, message, evidence }] }], summary: { pages,
errors, warnings } }` — fixed key order, no timestamps, byte-identical across runs.
Without it: one table row per page, then each page's findings with their evidence.

## Exit codes

| code | meaning                                                                             |
| ---- | ----------------------------------------------------------------------------------- |
| 0    | no error-level finding (warnings allowed)                                           |
| 1    | at least one error-level finding                                                    |
| 2    | the guard could not run: bad arguments, a listed URL not 200, an unreadable sitemap |

## In CI

`scripts/seo-check.mjs` is the `seo` gate check (and a `pr.yml` leg): it starts the
built `apps/web` on `:3400`, requires the sitemap to pass, and requires `/before` —
the antipattern kept on purpose — to still fail, so a guard that stopped seeing
problems cannot pass green.

```yaml
- run: pnpm turbo run build --filter=@lab/web && node scripts/seo-check.mjs
```

Against a deployment: `pnpm --filter @lab/seo-guard exec seo-guard --sitemap https://<domain>/sitemap.xml`.
