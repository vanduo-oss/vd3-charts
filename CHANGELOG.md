# Changelog

All notable changes to `@vanduo-oss/vd3-charts` are documented here.

## 1.2.0 — 2026-10-30

### Added

- **Vue wrapper prop parity** — `VdChart` and typed convenience wrappers
  (`VdBarChart`, `VdLineChart`, `VdAreaChart`, `VdScatterChart`,
  `VdDonutChart`, `VdPieChart`) now declare, forward, and reactively watch
  `ariaLabel`, `margin`, `xScale`, `barPadding`, `stroke`, `strokeWidth`,
  `points`, `pointRadius`, `pointFill`, `pointOpacity`, `fill`, `fillOpacity`,
  `centerLabel`, and `centerSubLabel`.
- **Automatic theme reactivity** — `ChartInstance` observes `data-theme`,
  `data-primary`, `data-palette`, `data-neutral`, `class`, and `style` on
  `document.documentElement` and its target container via `MutationObserver`,
  re-rendering automatically when resolved `--vd-*` theme tokens change.
  `refresh()` remains available for imperative redraws.
- **Polar `color` and `legend.position` support** — `DonutChart` and `PieChart`
  now honor `color` (CSS color string, field name, or `(row) => color`
  callback) and `legend: { position: 'top' | 'right' }`; Cartesian charts now
  honor `legend: { position: 'right' }` in addition to `'top'`.
- **Release & pack consumer verification** — added `pnpm run release:check`,
  `scripts/pack-smoke.mjs` (packed tarball file allow-list plus temporary ESM
  and CJS consumer smoke tests), strict OpenSpec validation, and a Node
  `20.19.0` engine-floor CI job.

### Fixed

- **CSS color strings in `color` option** — passing a CSS color string (such as
  `'#40c057'`, `'rgb(...)'`, `'var(--vd-color-success)'`) to `color` now styles
  marks with that color across bar, line, area, scatter, donut, and pie charts
  instead of looking up a missing row property.
- **Typed convenience wrapper emits** — `VdBarChart`, `VdLineChart`,
  `VdAreaChart`, `VdScatterChart`, `VdDonutChart`, and `VdPieChart` explicitly
  declare and forward `bar-click`, `point-click`, and `slice-click`.

## 1.1.1 — 2026-09-17

### Fixed

- **Pie defaults** — omitting `innerRadiusRatio` (or removing the Vue prop)
  keeps a filled pie. Donut still opens a hole.
- **Updates** — the resize observer follows `responsive` false→true→false.
  Data redraws keep logical keyboard focus when the mark still exists.
  Vue `refresh()` redraws after CSS-only theme changes. Touch can reveal
  details.

## 1.1.0 — 2026-09-13

Extracted from `@vanduo-oss/vd3-cbun@1.4.2` as a standalone package. Component
API and `VD_CHARTS_VERSION` remain `1.1.0` (Vue wrappers + core factories,
scales, helpers; WAI-ARIA Graphics roles; keyboard mark navigation; data table;
responsive height ignores visible table growth; mark-click emits; additive core
`role` / Vue `svgRole`).
