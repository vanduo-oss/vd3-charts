---
name: vanduo-vd3-charts
description: Use when adding Vanduo Vue 3 charts with @vanduo-oss/vd3-charts — SVG bar, line, area, scatter, donut, and pie wrappers plus a framework-agnostic core. Covers install, CSS, theming, a11y, and VD_CHARTS_VERSION.
---

# @vanduo-oss/vd3-charts

Standalone Vue 3 charts package. `vue >=3.3.0` is a required peer. The root
import re-exports the Vue wrapper family AND the framework-agnostic core.
`VD_CHARTS_VERSION` is `1.1.0` and matches `package.json`.

## Install

```sh
pnpm add @vanduo-oss/vd3-charts
```

Nothing registers globally. For correct theming, provide the Vanduo `--vd-*`
design tokens (see [Theming](#theming)).

## Charts

```js
import {
  VdChart, // generic; pick the type via the `type` prop
  VdBarChart,
  VdLineChart,
  VdAreaChart,
  VdScatterChart,
  VdDonutChart,
  VdPieChart,
} from '@vanduo-oss/vd3-charts';
import '@vanduo-oss/vd3-charts/css';
```

The same entry re-exports the framework-agnostic core: the chart factories
(`BarChart`, `LineChart`, `AreaChart`, `ScatterChart`, `DonutChart`, `PieChart`),
the scales (`scaleLinear`, `scaleTime`, `scaleBand`, `scalePoint`,
`scaleOrdinal`), accessor/tick helpers (`createAccessor`, `ticks`,
`niceDomain`), the path builders (`linePath`, `areaPath`, `arcPath`), and
`resolveTheme`. No name collision, so the core factories keep their own names.
CSS ships at `@vanduo-oss/vd3-charts/css`. Charts expose WAI-ARIA Graphics
roles, arrow-key mark navigation, and an accessible data table (`dataTable`:
`true` / `false` / `'visible'`; `ariaRoleDescription` overrides the SVG
description; core `role` / Vue `svgRole` override the default
`graphics-document document` role without consuming the Vue root `role`
attribute). `VD_CHARTS_VERSION` is `1.1.0`.

## Theming

Charts use `--vd-*` tokens with built-in fallbacks. vd3 is not a package
dependency.

```js
import '@vanduo-oss/vd3/css';
import '@vanduo-oss/vd3/css/core';
```
