# Project Index: landing-lab

Version 0.1.0 · generated 2026-11-10 (regenerate with `/sc:index-repo` — a stale date here
means the index needs a refresh)

A public lab on marketing landing pages: how a page heavy with images, missing alt text
and mixed SEO signals is fixed with a design-system component, measured before and
after, protected by visual regression and guarded in CI. The brand, Taskbloom, is
fictional. Seeded from [`acceptance-gate`](https://github.com/climaa/acceptance-gate) at
`5b45da5`; the blog and the manual stayed there.

## 📁 Project Structure

```
.sandcastle/           the autonomous orchestrator, inherited and inert here (no .env)
.claude/skills/        five agent skills, committed so a sandbox sees them
apps/
  storybook/           Storybook 10 for packages/ui and the console's screens
  visual-diff-ui/      the visual-diff console: sets, reports, the shot view
  e2e/                 playwright-bdd acceptance suite; features/** is human-owned
packages/
  ui/                  atoms · molecules · organisms · templates, token-only styling
  visual-diff/         the visual-regression CLI + 248 committed baselines
  logger/              logging, Bugsink adapter, the analytics opt-out
  links/               URL builders the console imports
  tsconfig/            shared compiler options
designs/               the .pen boards and their exports (designs/STANDARD.md)
scripts/               the gate, complexity ceiling, boards, index and leak checks
```

## 🚀 Entry Points

- Console: `pnpm --filter @lab/visual-diff-ui dev` on :3300
- Storybook: `pnpm --filter @lab/storybook dev`
- The gate: `pnpm gate` (fast tier, also the Husky pre-push hook); `pnpm gate --tier full`
  adds visual-diff in the pinned container
- Acceptance suite: `turbo run e2e` — the console on :3200 and :3201, two seeded worlds

## 🔧 Configuration

- `turbo.json` — `build`/`lint`/`typecheck`/`test` (+`dependsOn: ["^build"]`), `e2e`
  (dependsOn `@lab/visual-diff-ui#build`, uncached), `health` (its `inputs` include
  `scripts/complexity-gate.mjs`)
- `scripts/gate/manifest.mjs` — the gate as data: lint, typecheck, build, test, format,
  health, leak, boards, sandcastle, e2e (fast); visual-diff (full)
- `pnpm-workspace.yaml` — `minimumReleaseAge` three days, `engineStrict`

## 🧪 Tests

- Workspace test files: `apps/visual-diff-ui` 83 · `packages/ui` 39 ·
  `packages/visual-diff` 11 · `apps/storybook` 10 · `packages/logger` 3 · `apps/e2e` 2 ·
  `packages/links` 1; root `scripts/` and `.sandcastle/` 65
- `apps/e2e`: 54 acceptance scenarios (the visual-diff console) and 1 local-lane scenario
- `packages/visual-diff`: 248 committed baselines across atoms, molecules, organisms,
  templates and the console's screens
