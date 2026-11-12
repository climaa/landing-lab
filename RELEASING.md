# Releasing

Nothing here publishes to npm. Every workspace is `private: true`, so the version is a
coherence marker rather than a distribution fact: the repo is the product, and it carries
one version across all eleven manifests.

`CHANGELOG.md` at the root is the changelog's source. There are no changesets. **"Add a
changelog entry" means "add it under `## Unreleased` in `CHANGELOG.md`."** At release time
that section is written up into the four-part body and moved under its version, and the
GitHub Release body is copied from it, never written separately: one text, so the two
cannot drift. If someone asks for a changeset here, say the mechanism does not exist
rather than adding the tooling.

This procedure is inherited from `acceptance-gate`, where a blog renders every release
body on a `/changelog` page. landing-lab has no such page; the GitHub Release is the page.

## The four parts

Every release body has the same four parts, in the same order.

1. **A thesis line.** One sentence saying what the release is, before any version number
   or PR list. A reader with fifteen seconds gets the story from this line alone.
2. **What earned the version.** A `| Layer | PRs |` table: the cycle's pull requests
   grouped into the things they were actually for. A commit log records what happened;
   this table claims why it mattered, and the version number is only justified if the
   claim holds. _Minor_ means the table has a row that adds behaviour. _Patch_ means it
   does not.
3. **Index corrections.** Which `PROJECT_INDEX.md` numbers were wrong at the previous
   release and what they are now — measured, never adjusted. This is the part that makes
   the documentation something that can be wrong, audited where it is cheapest to audit.
4. **Known gaps.** What did not land, and why. A release that only lists wins is
   marketing; a release that names the miss is a record.

Close with `**Full changelog:** <compare URL>`.

The release commit's message and the release body are two different artifacts: the commit
body is hard-wrapped prose for `git log`, the release body is markdown with headings and
tables for people who will never open the repository. Never paste one into the other.

## The procedure

1. Branch `release/X.Y.Z` off `main`.

2. Bump **eleven** manifests in lockstep — the root, `apps/{e2e,storybook,visual-diff-ui,web}`
   and `packages/{links,logger,seo-guard,tsconfig,ui,visual-diff}`, plus any workspace added
   since (count `apps/*/package.json` and `packages/*/package.json`). Nothing else in the
   tree carries the version. A first release tags the version the manifests already carry
   and skips this step.

3. Prove `pnpm install --frozen-lockfile` still resolves and leaves `pnpm-lock.yaml`
   untouched. Every internal dependency is `workspace:*`, so it should — verify it rather
   than asserting it.

4. **Refresh `PROJECT_INDEX.md` and `README.md` in this same PR.** Regenerate the index
   with `/sc:index-repo`, then check every count-bearing claim against a real run:

   ```bash
   pnpm test                                    # per-workspace file/test counts
   pnpm test:sandcastle                         # the orchestrator's own suite
   node apps/e2e/scripts/suite-integrity.mjs    # EXPECTED_SCENARIOS
   node apps/e2e/scripts/local-integrity.mjs    # EXPECTED_LOCAL_SCENARIOS
   git ls-files packages/visual-diff/__baselines__ | grep -c '\.png$'   # baselines
   ```

   Write down the before/after of every number that moved — that list _is_ part 3 of the
   release body, and it cannot be reconstructed after the fact.

   `scripts/index-integrity.mjs`, run by `health:check`, holds two of those numbers to the
   tree — the version stamp against the root manifest, and the committed baseline count
   against the PNGs git tracks — so forgetting this step fails a gate check rather than
   going quiet. The per-workspace test counts are still yours to measure.

5. PR titled `release: X.Y.Z — <headline>`, with the release notes as the body. Gate green,
   then **squash**-merge; every release commit on `main` has a single parent and `(#NNN)`
   in its subject.

6. Annotated tag on the merge commit:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z — <headline>"
   git push origin vX.Y.Z
   ```

   The message is that one line. No body.

7. Publish, with the four-part body in a file:

   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z — <headline>" --notes-file <path> --verify-tag
   ```

   The file is the version's section of `CHANGELOG.md`, which the release PR moved out of
   `## Unreleased`, with its headings shifted back up one level (`###` → `##`). Copy it;
   do not rewrite it. The title reads `vX.Y.Z — <narrative>`, em-dash separated.

Deploying is not a step here: two Vercel projects (the category pages and Storybook)
deploy `main` to production on every merge, so the release PR's merge is the deploy.
