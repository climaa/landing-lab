# landing-lab

A small public lab on marketing landing pages: how a page heavy with images, missing
alt text and inconsistent SEO signals gets fixed with a design-system component,
measured before and after, protected by visual regression and guarded in CI.

The brand on every page is fictional. No real company's name, logo, colours, copy or
screenshots appear anywhere in this repository.

Seeded from [`acceptance-gate`](https://github.com/climaa/acceptance-gate) at `5b45da5`:
pnpm + Turborepo, `packages/ui` with token-only styling, the visual-diff flow and its
console, the local gate (Husky `pre-push`). The plan lives in `claudedocs/`.
