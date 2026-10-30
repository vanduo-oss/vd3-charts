# charts Specification

## Purpose
Vue chart wrappers (`VdChart` and typed convenience charts) plus the
framework-agnostic chart core, scales, and helpers on the package root.
## Requirements
### Requirement: charts subpath exports Vue wrappers alongside the core

The package entry SHALL export the Vue wrappers (`VdChart` and typed
`VdBarChart`..`VdPieChart`) and re-export the framework-agnostic core factories
(`BarChart`..`PieChart`), scales (`scaleLinear`, `scaleTime`, `scaleBand`,
`scalePoint`, `scaleOrdinal`), helpers (`createAccessor`, `ticks`, `niceDomain`,
`linePath`, `areaPath`, `arcPath`), `resolveTheme`, and `VD_CHARTS_VERSION`.
Named exports only; the core MUST NOT import `vue`.

#### Scenario: consumer imports wrapper and core from one subpath

- **GIVEN** a Vue 3 project with `@vanduo-oss/vd3-charts` installed
- **WHEN** it executes
  `import { VdChart, BarChart, scaleLinear } from '@vanduo-oss/vd3-charts'`
- **THEN** `VdChart` is a mountable Vue component and `BarChart`/`scaleLinear`
  are the framework-agnostic factory and scale functions

#### Scenario: core factory renders without Vue

- **GIVEN** a browser DOM container element
- **WHEN** `BarChart({ target, data, x, y })` is invoked directly (no Vue in
  play)
- **THEN** an SVG bar chart is rendered into the container exactly as the
  old-line core did

### Requirement: charts vanilla layer is excised

The charts module SHALL NOT export `init`, `destroy` (module-level),
`destroyAll`, `reinit`, `instances`, `optionsFromElement`, `VanduoCharts`, or
`__testing`. Importing any package file MUST NOT read/write
`window.VanduoCharts`, call `window.Vanduo.register`, or scan for
`data-vd-chart`. Path and scale helpers (`linePath`, `areaPath`, `arcPath`,
`niceDomain`, `ticks`) remain direct named exports.

#### Scenario: importing the module registers no globals

- **GIVEN** a browser-like environment where `window.VanduoCharts` is
  undefined
- **WHEN** `@vanduo-oss/vd3-charts` is imported
- **THEN** `window.VanduoCharts` is still undefined and no chart instances
  have been created

#### Scenario: importing the module in Node does not throw

- **GIVEN** a Node process without a DOM (`window` undefined)
- **WHEN** the package entry is imported
- **THEN** the import succeeds (guarded helpers like `resolveTheme` return
  fallback values instead of touching the DOM)

### Requirement: charts version constant is 1.2.0

`VD_CHARTS_VERSION` SHALL be `'1.2.0'` (continuing the `1.0.0` → `1.1.0` →
`1.1.1` → `1.2.0` lineage for Vue wrapper prop parity, CSS color strings, polar
`color`, `legend.position`, automatic theme reactivity, and release QA gates)
and MUST equal `package.json` `version`.

#### Scenario: version constant matches the manifest

- **GIVEN** the charts core and `package.json`
- **WHEN** `VD_CHARTS_VERSION` is compared against `package.json` `version`
- **THEN** both are exactly `'1.2.0'`

### Requirement: charts stylesheet ships as a css subpath

The charts stylesheet SHALL live at `src/styles.css`
and be published as `dist/vd3-charts.css`, resolvable via the
`./css` export.

#### Scenario: stylesheet resolves through the exports map

- **GIVEN** a bundler that honors package `exports`
- **WHEN** the consumer imports `@vanduo-oss/vd3-charts/css`
- **THEN** it resolves to `dist/vd3-charts.css`, whose rules match the
  old-line `charts/src/styles.css`

### Requirement: charts unit and wrapper test coverage

The repo SHALL provide Vitest coverage for `createAccessor`, scales
(`scaleLinear`, `scaleBand`, `scalePoint`, `scaleTime`, `scaleOrdinal`),
`niceDomain`/`ticks`, path helpers (`linePath`, `areaPath`, `arcPath`), factory
options (`innerRadiusRatio`, row filtering), and `VdChart` mount/update/unmount.
The suite MUST assert `VD_CHARTS_VERSION === '1.2.0'` and matches `package.json`
`version`. Scale/path/accessor specs SHALL run in Node; factory and mount specs
run under jsdom.

#### Scenario: primitives pass without a DOM

- **GIVEN** the charts scale/path/accessor specs running under vitest's node
  environment
- **WHEN** `pnpm test` runs
- **THEN** they pass without touching `window` or `document`
  (e.g. `scaleLinear({ domain: [0, 100], range: [0, 500] })(50) === 250`,
  `areaPath` output ends with `Z`)

#### Scenario: wrapper mount renders and cleans up

- **GIVEN** a jsdom mount of `VdChart` with `type="bar"` and three data rows
- **WHEN** the component mounts and is then unmounted
- **THEN** an `svg` with the chart root class exists inside the wrapper
  element after mount, and the container is emptied on unmount

#### Scenario: version constant is pinned

- **GIVEN** the charts unit suite
- **WHEN** it compares `VD_CHARTS_VERSION` with `package.json` `version`
- **THEN** the test fails unless both are exactly `'1.2.0'`

### Requirement: charts real-browser smoke coverage

The Playwright smoke suite SHALL run against a harness page that imports the
built `dist/index.js` ESM entry (with `vue` resolved via an import map). It MUST
assert real rendering for bar (marks, hover tooltip, click callback), line and
area (non-empty `d` attributes, area closed with `Z`), and donut vs pie
inner-radius arc geometry.

#### Scenario: built charts entry renders in a real browser

- **GIVEN** `pnpm build` has produced `dist/index.js` and the static
  test server is running
- **WHEN** the Playwright charts spec loads the harness and invokes the
  render helpers
- **THEN** the SVG marks are present across bar / line / area / donut / pie,
  bar hover shows tooltip text, bar click data flows through the built entry,
  and donut vs pie path geometry differs as specified — proving the shipped
  artifact renders outside jsdom

### Requirement: bar chart baselines clamp to the rendered y-domain

`renderBarChart` and `renderMultiBarChart` SHALL anchor bars to a baseline clamped **into** the rendered y-domain — `yScale(Math.min(Math.max(0, yDomain[0]), yDomain[1]))` — matching the area/line renderers' clamp. An explicit `yMin > 0` (or `yMax < 0`), which `niceDomain` honors, MUST NOT cause bars to extrapolate past the axis floor.

#### Scenario: an explicit yMin > 0 keeps bars inside the plot

- **GIVEN** a `BarChart` (single- or multi-series) with `yMin: 10` and data values `≥ 10`
- **WHEN** the chart renders
- **THEN** every `rect.vd-chart-bar`'s bottom edge (`y + height`) is anchored to the plot floor and never extends below it (no overflow past the axis)

### Requirement: charts wrapper forwards mark clicks as Vue emits

`VdChart` and the typed convenience wrappers SHALL forward the core's mark-click
callbacks as kebab-case Vue emits (`bar-click`, `point-click`, `slice-click`),
each carrying the core `ClickEvent` payload (`{ event, datum, index }`)
unchanged. The emits MUST be typed by `VdChartEmits` exported from the package
entry.

#### Scenario: clicking a bar emits bar-click with the ClickEvent

- **GIVEN** a mounted `<VdChart type="bar" :data="rows" x="cat" y="val" />`
- **WHEN** a rendered `rect.vd-chart-bar` receives a `click`
- **THEN** the wrapper emits exactly one `bar-click` whose payload is the core `ClickEvent` — `datum` equals the clicked row and `index` is its position — and no `point-click` or `slice-click` is emitted

#### Scenario: clicking a scatter point emits point-click

- **GIVEN** a mounted `<VdChart type="scatter" :data="rows" x="a" y="b" />`
- **WHEN** a rendered `circle.vd-chart-scatter-point` receives a `click`
- **THEN** the wrapper emits exactly one `point-click` carrying the core `ClickEvent` for that datum (`datum`, `index`)

#### Scenario: clicking a pie slice emits slice-click

- **GIVEN** a mounted `<VdChart type="pie" :data="rows" label="cat" value="val" />`
- **WHEN** a rendered `path.vd-chart-slice` receives a `click`
- **THEN** the wrapper emits exactly one `slice-click` carrying the core `ClickEvent` for that slice

### Requirement: charts stylesheet respects dark mode

The charts stylesheet (`styles.css`) SHALL provide dark-mode overrides for
the tooltip element following vd3's dual-declaration pattern: an explicit
`[data-theme="dark"]` rule block AND a `@media (prefers-color-scheme: dark)
{ :root:not([data-theme]) }` fallback. The dark tooltip MUST swap
`background`, `border-color`, `color`, and `box-shadow` to dark-aware
values using `var(--vd-bg-primary)`, `var(--vd-border-color)`,
`var(--vd-text-primary)`, and an increased shadow opacity.

#### Scenario: tooltip appearance in dark mode

- **GIVEN** a page with `data-theme="dark"` on the root element
- **WHEN** a chart tooltip is shown
- **THEN** the tooltip background, border, text, and shadow use dark-mode
  values (not the light defaults)

### Requirement: interactive chart marks provide a focus indicator

Interactive chart marks (elements with `tabindex="0"`) SHALL receive a
visible `:focus-visible` indicator via the charts stylesheet. The indicator
MUST use `var(--vd-color-primary)` for the outline color, matching vd3's
button focus-ring convention (`outline: 2px solid …; outline-offset`).

#### Scenario: keyboard user sees focus ring on a bar

- **GIVEN** a rendered bar chart with keyboard focus on a `rect.vd-chart-bar`
- **WHEN** the element receives `:focus-visible` state
- **THEN** a 2px primary-colored outline is displayed around the bar

### Requirement: tooltip transition respects prefers-reduced-motion

The charts stylesheet SHALL include a `@media (prefers-reduced-motion:
reduce)` guard that disables the tooltip opacity transition.

#### Scenario: no tooltip animation under reduced motion

- **GIVEN** an OS or browser setting for reduced motion
- **WHEN** a chart tooltip is shown or hidden
- **THEN** the tooltip appears/disappears instantly with no transition

### Requirement: bar chart renders negative y-values correctly

When a bar chart row has a negative `y` value, the bar SHALL extend
downward from the zero baseline (or the clamped baseline when `yMin > 0`).
The bar MUST still have a positive `height`, and its `aria-label` MUST
include the negative number.

#### Scenario: mixed positive and negative bar data

- **GIVEN** a `BarChart` with data `[{x:'a', y:10}, {x:'b', y:-5}]`
- **WHEN** the chart renders
- **THEN** both bars have `height > 0`, the negative bar's `rect.y` is at
  or below the baseline, and the negative bar's `aria-label` contains `-5`

### Requirement: annotations render reference lines when provided

When `options.annotations` contains entries with a numeric `y`, the chart
SHALL draw a horizontal reference line at the scaled `y` position. When an
entry has an `x` value, the chart SHALL draw a vertical reference line. The
line SHALL use a dashed stroke by default (`stroke-dasharray: 4 3`) and a
solid stroke when `dash: false`. If a `label` is present, it SHALL be
rendered as a text element near the line.

#### Scenario: horizontal annotation with label

- **GIVEN** a `BarChart` with `annotations: [{ y: 5, label: 'Target' }]`
- **WHEN** the chart renders
- **THEN** a dashed horizontal line appears at the y=5 position and the
  text "Target" is visible near the line

### Requirement: WAI-ARIA Graphics Module semantics and structure

The chart SVG shell SHALL provide `role="graphics-document document"` (or an
explicit `role` / Vue `svgRole`) and `aria-roledescription="[kind] chart"` (or
`ariaRoleDescription`). Mark groups SHALL provide `role="graphics-object"` and
individual marks SHALL provide `role="graphics-symbol"` with an appropriate
`aria-roledescription`. Decorative axes and grid lines SHALL have
`aria-hidden="true"`.

#### Scenario: graphics roles present on chart elements

- **GIVEN** a rendered `BarChart` with data
- **WHEN** assistive technology inspects the chart DOM
- **THEN** the root `svg` has `role="graphics-document document"` and
  `aria-roledescription="bar chart"`, the mark container has
  `role="graphics-object"`, each bar mark has `role="graphics-symbol"` and
  `aria-roledescription="bar"`, and `vd-chart-axes` has `aria-hidden="true"`

#### Scenario: explicit role overrides the default graphics role

- **GIVEN** a `BarChart` rendered with `role: 'graphics-object'`
- **WHEN** the chart DOM is inspected
- **THEN** the root `svg` has `role="graphics-object"` instead of the default
  `graphics-document document`

#### Scenario: Vue svgRole preserves root role fallthrough

- **GIVEN** a `<VdChart role="region" svg-role="graphics-object" />`
- **WHEN** the wrapper mounts
- **THEN** the root container keeps `role="region"` and the inner SVG has
  `role="graphics-object"`

### Requirement: keyboard arrow navigation across interactive chart marks

When an interactive chart mark (`tabindex="0"`) has focus, `ArrowRight`/`ArrowDown`
SHALL move focus to the next mark (wrapping around), `ArrowLeft`/`ArrowUp` to
the previous mark, and `Home`/`End` to the first or last mark. Moving focus
SHALL update the active tooltip, and `Escape` SHALL blur the mark and dismiss
the tooltip.

#### Scenario: roving arrow navigation and tooltip activation

- **GIVEN** a rendered bar chart with focus on the first bar
- **WHEN** the user presses `ArrowRight`
- **THEN** focus moves to the second bar, and the tooltip becomes visible
  displaying the second bar's data

### Requirement: accessible HTML data table fallback for screen readers

Every rendered chart SHALL generate a `.vd-chart-sr-only` HTML `<table>`
(`<caption>`, `<thead>`, `<tbody>`) summarizing its data (WCAG 1.1.1). Setting
`dataTable: false` MUST suppress it, and `dataTable: 'visible'` MUST render it
visibly. Destroying the chart MUST remove the table. Multi-series line/area
tables MUST match each row's x value by normalized scale key so per-series
`Date`/object x values populate every column.

#### Scenario: default screen-reader data table generation

- **GIVEN** a `BarChart` rendered with title "Q3 Sales"
- **WHEN** the chart mounts
- **THEN** a `table.vd-chart-data-table.vd-chart-sr-only` exists inside the target
  containing a caption "Q3 Sales", column headers for Category and Value, and a
  row for each data point

#### Scenario: per-series Date x values fill every series column

- **GIVEN** a multi-series `LineChart` whose series each carry distinct `Date`
  instances at the same timestamps
- **WHEN** the data table is generated
- **THEN** every series column is populated for each timestamp and no cell is
  blank, with one table row per unique timestamp

### Requirement: responsive sizing excludes the visible data table

When no explicit `height` is supplied and `responsive` is enabled, the chart's
measured height SHALL exclude the layout height of a visible data table, and
`ResizeObserver` MUST compare the chart-area size so table-only growth does not
trigger a re-render. Visually hidden (`.vd-chart-sr-only`) tables MUST
contribute zero height.

#### Scenario: table growth does not re-render the chart

- **GIVEN** a responsive chart with `dataTable: 'visible'` and no explicit height
- **WHEN** the visible table grows and the container grows by the same amount
- **THEN** the chart area is unchanged and no re-render is triggered

#### Scenario: a real container resize still re-renders

- **GIVEN** the same responsive chart
- **WHEN** the container height changes independently of the table
- **THEN** the chart re-renders once with the new size

### Requirement: Vue wrapper forwards full core styling and layout options

`VdChart` and the typed convenience wrappers (`VdBarChart`, `VdLineChart`,
`VdAreaChart`, `VdScatterChart`, `VdDonutChart`, `VdPieChart`) SHALL declare
and forward the core styling, layout, and scale options (`ariaLabel`, `margin`,
`xScale`, `barPadding`, `stroke`, `strokeWidth`, `points`, `pointRadius`,
`pointFill`, `pointOpacity`, `fill`, `fillOpacity`, `centerLabel`,
`centerSubLabel`) and reactive changes to any of these props MUST update the
underlying chart instance in place.

#### Scenario: Vue wrapper forwards mark styling and donut center props

- **GIVEN** a mounted `VdLineChart` or `VdDonutChart`
- **WHEN** `stroke`, `strokeWidth`, `points: false`, `centerLabel`, or
  `centerSubLabel` is passed or updated
- **THEN** the rendered SVG marks and center text reflect the prop values

### Requirement: color option supports CSS color strings, field names, and callbacks across Cartesian and polar charts

When `options.color` is a CSS color string (`#...`, `rgb(...)`, `hsl(...)`,
`oklch(...)`, `var(...)`), the chart SHALL apply that color to marks instead of
treating the string as a data property key. When `options.color` is a field
name or callback `(row) => color`, Cartesian (`BarChart`, `LineChart`,
`AreaChart`, `ScatterChart`) and polar (`DonutChart`, `PieChart`) charts SHALL
resolve mark colors accordingly.

#### Scenario: CSS color string and polar slice color

- **GIVEN** a `BarChart` or `DonutChart` with `color: '#40c057'` or a per-slice
  callback
- **WHEN** the chart renders
- **THEN** the rendered bars or slices use the resolved CSS color

### Requirement: legend position and automatic theme reactivity

`options.legend` SHALL honor `{ position: 'top' | 'right' }` across Cartesian
and polar charts. Every `ChartInstance` SHALL observe theme attribute mutations
(`data-theme`, `data-primary`, `data-palette`, `data-neutral`, `class`, `style`)
on `document.documentElement` and its target container, re-rendering when the
resolved theme tokens change and disconnecting the observer on `destroy()`.

#### Scenario: document theme change re-renders chart colors automatically

- **GIVEN** a mounted chart instance and a CSS variable change on
  `document.documentElement` or the chart target
- **WHEN** `data-theme` or inline theme variables mutate
- **THEN** the chart re-renders with the updated resolved theme without
  requiring a manual `refresh()` call
