# Changelog

All notable changes to `@vanduo-oss/vd3-charts` are documented here.

## Unreleased

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
