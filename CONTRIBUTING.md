# Contributing to vd3-charts

## Branch and remote actions

Start a `dev-vXXX` branch from freshly fetched `origin/main`. Keep work and
commits local until the user and agent are satisfied with local QA. Push, PR,
merge, publish, and deploy require explicit authorization. Do not edit `main`.

## Setup

Requires **Node 24** (CI) and **pnpm 10**. Consumers of the compiled package
only need **Node >= 20.19**.

```sh
pnpm install
```

## Gates

```sh
pnpm lint
pnpm format:check
pnpm stylelint
pnpm test
pnpm build
pnpm test:types
pnpm test:e2e
```

`test:types` and `test:e2e` consume `dist/` — run `pnpm build` first.
Install Chromium once: `pnpm exec playwright install chromium`.

## OpenSpec

Active changes live in `openspec/changes/`. Archive with
`openspec archive <id> --yes` so deltas merge into `openspec/specs/`.
`openspec/` is not published.

## Release

Bump `package.json` and `VD_CHARTS_VERSION` together. `pnpm release` builds
then publishes; do not publish from a docs-only or incomplete branch. The
hardened `.npmrc` `ignore-scripts=true` skips `prepack`, so the explicit
`release` script is required.
