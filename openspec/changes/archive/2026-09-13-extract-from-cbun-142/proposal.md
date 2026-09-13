# Extract charts from vd3-cbun 1.4.2

## Why

Charts will continue to evolve as a standalone package. `@vanduo-oss/vd3-cbun`
is read-only going forward. Recreate the charts component 1-to-1 as
`@vanduo-oss/vd3-charts@1.1.0`.

## What Changes

- New standalone repo with JS core + Vue wrappers, hand-written `.d.ts`,
  esbuild esm+cjs, and `./css`.
- `VD_CHARTS_VERSION` stays `1.1.0` and equals `package.json` version.
- Full QA gates (lint, format, stylelint, test, build, test:types, Playwright).

## Non-goals

- No API changes versus cbun charts 1.1.0.
- No SFC rewrite.
- No vd3-docs consumer switch in this change.
- Do not edit vd3-cbun.
