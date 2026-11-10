# landing-lab

A category page that draws every star of every rating as its own `<img>`, with no `alt`,
spends hundreds of images on decoration and tells a screen reader nothing about the score.
This lab fixes that class of problem the way a design-system team would: a `RatingStars`
component that draws a rating as one named element, the same page built both ways and
**measured** side by side, the fixed page protected by visual regression, and an
**SEO guard** in CI that fails on the signals that confuse search engines (links to
non-canonical URLs, a language declared twice, alternates that do not point back, broken
JSON-LD). The brand, Taskbloom, and everything on its pages are fictional.

**Live:** [landing-lab.carloslima.dev/compare](https://landing-lab.carloslima.dev/compare),
the two pages side by side with their numbers measured in your browser ·
[/before](https://landing-lab.carloslima.dev/before) ·
[/after](https://landing-lab.carloslima.dev/after) ·
[Storybook](https://landing-lab-storybook.vercel.app/) (the component and its
[design notes](https://landing-lab-storybook.vercel.app/index.html?path=/docs/docs-atomic-design-rating-stars--docs))

## Before and after, measured

Production build, Chromium at 1280×800, three runs. All three were identical (spread 0).

|                                | `/before` (one `<img>` per star)     | `/after` (`RatingStars`) |
| ------------------------------ | ------------------------------------ | ------------------------ |
| `<img>` in the page            | 660                                  | **0**                    |
| `<img>` without `alt`          | 660                                  | **0**                    |
| DOM elements                   | 1,529                                | **973** (−36 %)          |
| axe violations (WCAG 2.1 A/AA) | 1 rule (`image-alt`) on 660 elements | **0**                    |
| HTML, decoded                  | 219.5 KB                             | **160.2 KB** (−27 %)     |
| HTML, gzip on the wire         | 12.3 KB                              | 11.9 KB (−3 %)           |
| SEO guard                      | 4 errors                             | **0**                    |

Same 100 reviews and 10 businesses on both pages; only how a rating and an avatar are built
differs. The HTML saving is mostly repetition that gzip already removes. The images, the
DOM and the accessibility failure are what change.

## Run the SEO guard on any site

```sh
git clone https://github.com/climaa/landing-lab && cd landing-lab
pnpm install
pnpm seo-guard --sitemap https://your-site.example/sitemap.xml
pnpm seo-guard https://your-site.example/some/page --json
```

It reads pages the way a crawler does, with fetch and no JavaScript. It fetches each
internal link and alternate once, never follows external links, and exits **0** with no
errors, **1** with findings, or **2** when it could not run. Rules, output and a CI
example are in [`packages/seo-guard/README.md`](packages/seo-guard/README.md).

## What is in here

| Path                                          | What                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `packages/ui`                                 | The design system, token-only styling. `atoms/RatingStars` is the fix                       |
| `apps/web`                                    | Taskbloom's category page: `/before`, `/after`, their alternates, `/compare` and `/api/seo` |
| `packages/seo-guard`                          | The guard: library, CLI and the `seo` gate check                                            |
| `packages/visual-diff`, `apps/visual-diff-ui` | Visual regression: 260 committed baselines and the console that reviews them                |
| `apps/e2e`                                    | The acceptance suite: 73 Gherkin scenarios on desktop and mobile                            |
| `designs/`                                    | The design boards. The board comes before the code                                          |

## The gate

`pnpm gate` runs before every push (Husky) and as `pr.yml` on every pull request: lint,
typecheck, build, test, format, complexity ≤ 20, the SEO guard, a leak guard, the design
boards, Sandcastle's own suite and the e2e suite. `pnpm gate --tier full` adds visual
regression in the pinned container.

Seeded from [`acceptance-gate`](https://github.com/climaa/acceptance-gate), whose pipeline
this lab reuses. MIT licensed.
