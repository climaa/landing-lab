# Project Index: landing-lab

Version 0.1.0 · generated 2026-11-12 (regenerate with `/sc:index-repo` — a stale date here
means the index needs a refresh)

A public lab on marketing landing pages: how a page heavy with images, missing alt text
and mixed SEO signals is fixed with a design-system component, measured before and
after, protected by visual regression and guarded in CI. The brand, Taskbloom, is
fictional. Seeded from [`acceptance-gate`](https://github.com/climaa/acceptance-gate) at
`5b45da5`; the blog and the manual stayed there.

## 📁 Project Structure

```
.sandcastle/           the autonomous orchestrator, inherited and inert here (no .env)
.claude/skills/        six agent skills, committed so a sandbox sees them
apps/
  storybook/           Storybook 10 for packages/ui and the console's screens
  visual-diff-ui/      the visual-diff console: sets, reports, the shot view
  web/                 Taskbloom's garden designers page: /before, /after and their addresses
  e2e/                 playwright-bdd acceptance suite; features/** is human-owned
packages/
  ui/                  atoms · molecules · organisms · templates, token-only styling
  visual-diff/         the visual-regression CLI + 260 committed baselines
  logger/              logging, Bugsink adapter, the analytics opt-out
  seo-guard/           a crawler-eye check of canonicals, hreflang and JSON-LD (CLI + library)
  links/               URL builders the console imports
  tsconfig/            shared compiler options
designs/               the .pen boards and their exports (designs/STANDARD.md)
scripts/               the gate, complexity ceiling, boards, index and leak checks
```

## 🚀 Entry Points

- Console: `pnpm --filter @lab/visual-diff-ui dev` on :3300
- Category pages: `pnpm --filter @lab/web dev` on :3400 (`/compare`, `/after`, `/before`)
- Storybook: `pnpm --filter @lab/storybook dev`
- The gate: `pnpm gate` (fast tier, also the Husky pre-push hook); `pnpm gate --tier full`
  adds visual-diff in the pinned container
- Acceptance suite: `turbo run e2e` — the console on :3200 and :3201, two seeded worlds

## 🔧 Configuration

- `turbo.json` — `build`/`lint`/`typecheck`/`test` (+`dependsOn: ["^build"]`), `e2e`
  (dependsOn `@lab/visual-diff-ui#build`, uncached), `health` (its `inputs` include
  `scripts/complexity-gate.mjs`)
- `scripts/gate/manifest.mjs` — the gate as data: lint, typecheck, build, test, format,
  health, seo, boards, sandcastle, e2e (fast); visual-diff (full). The leak guard runs
  in `.husky/pre-commit` instead
- `pnpm-workspace.yaml` — `minimumReleaseAge` three days, `engineStrict`

## 🧪 Tests

- Workspace test files: `apps/visual-diff-ui` 83 · `packages/ui` 40 ·
  `packages/visual-diff` 11 · `apps/storybook` 10 · `apps/web` 7 · `apps/e2e` 3 ·
  `packages/logger` 3 · `packages/seo-guard` 3 · `packages/links` 1; root `scripts/` 14
  and `.sandcastle/` 52
- `apps/e2e`: 73 acceptance scenarios (54 on the visual-diff console, 19 on the landing
  pages) and 1 local-lane scenario
- `packages/visual-diff`: 260 committed baselines across atoms, molecules, organisms,
  templates and the console's screens
