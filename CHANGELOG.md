# Changelog

Every release of `landing-lab`, newest first. At each release the `Unreleased` section is
written up and moved under its version.

## Unreleased

- The console's own pages are no longer screens here. `apps/visual-diff-ui` is maintained in acceptance-gate and copied into this repo as a tool, not as its product, so the set viewer and the report showed a `Screens / Visual-diff-ui` section for code this repo never changes. The five screen stories, their sample modules and tests, and their 28 baselines go; `APP_ROOTS` names only `apps/web`, and Storybook no longer globs, aliases or serves anything for the console. `designs/STANDARD.md` gains rule 7, "A child carries no console screens". Ported from climaa/acceptance-gate f16d8fb.
- Next moves to 16.4.6 and glob 13 / minimatch 10 leave the tree (GHSA-mfr8-8qww-v76h, GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249). Next 16.3.0–16.4.4 could hand one root param's `'use cache'` result to another when the same function is also reached through `unstable_cache()` on a cold start; glob <=14.0.1 kept walking after its AbortSignal fired; minimatch <11.0.1 amplified `**/../` patterns. Sentry moves to ^11.12, whose bundler plugins already ask for glob 14, and overrides in `pnpm-workspace.yaml` lift the parents that still pin the old majors, each with its exit condition beside it. Ported from climaa/acceptance-gate#719.

## 0.1.0 — 2026-11-12

A star rating drawn as one named image instead of five unnamed ones, measured on the page
before and after, and kept that way by an SEO guard, visual regression and an acceptance
suite.

### What earned the version

The first release. Everything below is new since the seed (`717f6a2`), so this is a
minor version: there are rows that add behaviour.

| Layer                                                            | PRs           |
| ---------------------------------------------------------------- | ------------- |
| The seed builds and gates on its own, without the parent's blog  | #8            |
| The design comes first: the landing parts on the boards          | #9            |
| `RatingStars`, one image per rating with its score as its name   | #10           |
| The category page twice, `/before` and `/after`, and `/compare`  | #11, #12, #14 |
| `packages/seo-guard`: canonicals, hreflang and JSON-LD, CLI + CI | #13, #17      |
| The acceptance suite covers the pages on desktop and mobile      | #15, #20      |
| The leak guard runs where its denylist is: before each commit    | #18           |
| The README, the RatingStars note, and Storybook's Quality Gates  | #16, #19      |

Measured on the production build (README, "Before and after, measured"): `<img>` in the
page 660 → 0, `<img>` without `alt` 660 → 0, DOM elements 1,529 → 973, axe violations 1
rule on 660 elements → 0, SEO guard 4 errors → 0.

### Index corrections

`PROJECT_INDEX.md` as of 2026-11-10, against this release, measured with the commands in
`RELEASING.md`:

| Claim                                    | Was        | Is  |
| ---------------------------------------- | ---------- | --- |
| Committed agent skills                   | five       | six |
| `packages/ui` test files                 | 39         | 40  |
| `apps/e2e` test files                    | 2          | 3   |
| `apps/web` test files                    | not listed | 7   |
| `packages/seo-guard` test files          | not listed | 3   |
| Root `scripts/` and `.sandcastle/` files | 65         | 66  |
| Acceptance scenarios                     | 54         | 73  |

Unchanged and verified: `apps/visual-diff-ui` 83, `packages/visual-diff` 11,
`apps/storybook` 10, `packages/logger` 3, `packages/links` 1 test files; 1 local-lane
scenario; 260 committed baselines.

### Known gaps

- `main` has no branch rule or ruleset requiring `gate`; a red `gate` is a signal, not a
  lock. The pre-push hook runs the same checks locally.
- The leak guard only checks commits made on a machine that holds `.leak-denylist`.
  `--no-verify`, a fresh clone and an agent sandbox go unchecked, by design.
- Nothing checks that `pr.yml`'s `checks` matrix matches `checksMatrix()` in
  `scripts/gate/manifest.mjs`, and the `test` leg already differs (`--concurrency`).
  The manifest's header still says the PR workflows are disabled; they run.
- The acceptance suite holds the DOM count relatively (after below before), not at 973.
- The metrics-strip race fixed in #20 needs a browser to reproduce; its regression test
  covers the parsing that turned it into a silent 0, not the wait itself.

**Full changelog:** https://github.com/climaa/landing-lab/compare/717f6a2...v0.1.0
