# @vanduo-oss/vd3-charts

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Vanduo **charts** for Vue 3: SVG bar, line, area, scatter, donut, and pie —
Vue wrappers plus a framework-agnostic core (factories, scales, helpers).
Extracted 1-to-1 from `@vanduo-oss/vd3-cbun` charts **1.1.0**.

**Status: 1.1.1.** `VD_CHARTS_VERSION` matches the package version. Pie
defaults stay filled when `innerRadiusRatio` is omitted; the resize observer
follows `responsive`; data redraws keep logical focus; Vue `refresh()` covers
CSS-only theme changes; touch can reveal details.

## Install

```sh
pnpm add @vanduo-oss/vd3-charts
```

`vue >=3.3.0` is a **required** peer dependency (the only runtime dep) — install
it alongside if your project does not already depend on Vue. For correct
theming, also provide the Vanduo `--vd-*` design tokens (see
[Theming](#theming)).

## Import

```js
import {
  VdChart,
  VdBarChart,
  VdLineChart,
  VdAreaChart,
  VdScatterChart,
  VdDonutChart,
  VdPieChart,
  BarChart,
  scaleLinear,
  VD_CHARTS_VERSION,
} from '@vanduo-oss/vd3-charts';
import '@vanduo-oss/vd3-charts/css';
```

Named exports only — no default export. The Vue wrappers are the primary
surface; the core factories (`BarChart`, `LineChart`, `AreaChart`,
`ScatterChart`, `DonutChart`, `PieChart`), scales (`scaleLinear`, `scaleTime`,
`scaleBand`, `scalePoint`, `scaleOrdinal`), helpers (`createAccessor`, `ticks`,
`niceDomain`, `linePath`, `areaPath`, `arcPath`), and `resolveTheme` are
re-exported alongside. The core does not import Vue.

`vue` is never bundled — it stays external in both the esm and cjs outputs.
The build emits `dist/meta.json` and **fails** if any input leaves `src/` or
if anything but `vue` is externalized. The package declares
`sideEffects: ["**/*.css"]`.

## Version policy

`package.json` version **is** `VD_CHARTS_VERSION` (`1.1.1`). Bump both together.
This continues the cbun charts lineage (old-line `0.2.0` → bundle `1.0.0` →
`1.0.1` bar baseline → `1.1.0` mark-click emits → `1.1.1` pie/update fixes).
Do not reuse the retired npm name `@vanduo-oss/charts`.

## Theming

Charts render against Vanduo `--vd-*` design tokens — the same tokens
`@vanduo-oss/vd3` defines — with built-in fallbacks. vd3 is not a package
dependency; any provider of the tokens works.

```js
import '@vanduo-oss/vd3/css';
// Same component styles without bundled icon fonts:
import '@vanduo-oss/vd3/css/core';
```

`@vanduo-oss/vd3/css/core` is **not** tokens-only. Token JSON is
`@vanduo-oss/vd3/tokens.json`.

Tokens consumed include `--vd-bg-primary`, `--vd-bg-secondary`,
`--vd-text-primary`, `--vd-text-muted`, `--vd-border-color`,
`--vd-color-primary`, and `--vd-chart-1`…`--vd-chart-8`.

## Security

- **No bundled dependencies** — beyond the `vue` peer, nothing is bundled; the
  build fails if any other module is externalized or any `node_modules` input
  is bundled.
- **Hardened `.npmrc`:** `ignore-scripts`, `minimum-release-age`, `save-exact`,
  `strict-peer-dependencies`, `trust-policy=no-downgrade`,
  `block-exotic-subdeps`, and an explicit `registry`.
- **MIT** licensed ([LICENSE](./LICENSE)); the package vendors no third-party
  runtime code.

## Exports

| Export | Contents |
| --- | --- |
| `@vanduo-oss/vd3-charts` | Vue wrappers + core factories, scales, helpers, `VD_CHARTS_VERSION` |
| `@vanduo-oss/vd3-charts/css` | Stylesheet (`dist/vd3-charts.css`) |

## Development

```sh
pnpm install
pnpm lint          # eslint
pnpm format:check  # prettier
pnpm stylelint     # authored CSS
pnpm test          # vitest (jsdom + node)
pnpm build         # esbuild harness → dist/
pnpm test:types    # tsc --noEmit over tests/types (needs dist/)
pnpm test:e2e      # Playwright Chromium (needs dist/)
```

`test:types` and `test:e2e` consume the built `dist/` output, so **run
`pnpm build` first**. Chromium must be installed once:
`pnpm exec playwright install chromium`.

The published package declares a consumer-friendly `engines.node >=20.19.0`;
the dev/CI toolchain pins Node 24 via `packageManager` +
`.github/workflows/ci.yml`.

## Documentation

- Agent / LLM reference — [SKILL.md](./SKILL.md)
- Contributing — [CONTRIBUTING.md](./CONTRIBUTING.md)
- Changelog — [CHANGELOG.md](./CHANGELOG.md)

## License

[MIT](./LICENSE) © Vanduo Open Source Foundation
