# Development audit exceptions

Approved by the maintainer on 2026-10-08 for the vd3 ecosystem security pass.
Owner: vanduo-oss. Review at the next dependency update or release and no later
than 2026-12-31, or sooner if a patched path ships.

## braces — CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm

- Installed path: `stylelint > micromatch > braces@3.0.3`.
- Patched version: none at approval time.
- Scope: development tooling only. Published `@vanduo-oss/vd3-charts` has no
  runtime dependencies beyond the Vue peer; esbuild externalizes Vue and
  rejects bundled `node_modules`.

CI uses:

```sh
pnpm audit --audit-level=moderate --ignore GHSA-vfj7-8cjw-p6xm
```

pnpm 10.28.2 does not enforce the former `auditConfig.ignoreCves` workspace
setting. The explicit CLI flag is the gate; an unfiltered audit still exposes
the approved advisory.

## uri-js — CVE-2026-93690 / CVE-2026-93751 / CVE-2026-103387

- Installed path: `eslint > ajv > uri-js@4.4.1`.
- Patched version: none reported by Snyk (`fixedIn: []`).
- Scope: eslint on repository-owned sources.

## Snyk organization policy

The `vanduo-oss-default` organization-specific policy contains exactly:

- `SNYK-JS-BRACES-19963945`
- `SNYK-JS-URIJS-19963961`
- `SNYK-JS-URIJS-19963963`
- `SNYK-JS-URIJS-20341609`

The policy has no automatic expiry and no unpatched-only condition. Review and
remove it manually by 2026-12-31, removing individual IDs earlier when patched
paths ship. Do not add fixable findings or MPL-2.0 license findings.

## Reviewed dev dependencies

Non-runtime, dev-only packages are reviewed before they enter the gate sequence.
They are never published (`files` excludes them) and never loaded by consumers.

### @fission-ai/openspec@1.14.3 — approved 2026-11-01

Runs `openspec validate --all --strict` inside `release:check`. It pulls
`@inquirer/*`, `ora`, `zod`, `yaml`, `diff`, and `tinyglobby` — a sizable
transitive tree, so it was reviewed rather than assumed:

- Publisher: `Fission-AI` GitHub organization (MIT, public repo, actively
  maintained). Not a single-maintainer or typosquatted scope.
- Provenance: the published tarball carries SLSA provenance
  (`slsa.dev/provenance/v1`) and npm registry signatures.
- Execution: **no** `preinstall` / `install` / `postinstall` lifecycle scripts,
  and `.npmrc` sets `ignore-scripts=true` regardless.
- Pinning: exact version, integrity hash in `pnpm-lock.yaml`, dev-only.
- Audit: `pnpm audit` reports no advisories for it or its tree.
- Scope: the CLI runs against repository-owned markdown only; it is not a
  runtime dependency and is absent from the published tarball.

Validation is deliberately not hand-rolled. `--strict` promotes warnings to
failures and enforces requirement/scenario parsing, delta ADDED/MODIFIED/
REMOVED/RENAMED consistency, archive merge conflicts, and task numbering. A
replacement would have to reimplement those rules and would be weaker.

Review again at the next dependency update or release and no later than
2026-12-31.

## Removal conditions

Remove each exception when a supported patched path is available and the
filtered audit plus the package CI gates stay green.
Do not copy exceptions to unrelated advisories.
