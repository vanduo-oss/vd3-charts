# charts Specification

## Purpose
Vue chart wrappers (`VdChart` and typed convenience charts) plus the
framework-agnostic chart core, scales, and helpers on the package root.
## Requirements
### Requirement: charts subpath exports Vue wrappers alongside the core

The package entry SHALL export the Vue wrapper family as the
primary surface — `VdChart` plus the typed convenience wrappers `VdBarChart`,
`VdLineChart`, `VdAreaChart`, `VdScatterChart`, `VdDonutChart`, `VdPieChart` —
and SHALL re-export the framework-agnostic core alongside: the factories
`BarChart`, `LineChart`, `AreaChart`, `ScatterChart`, `DonutChart`,
`PieChart`; the scales `scaleLinear`, `scaleTime`, `scaleBand`, `scalePoint`,
`scaleOrdinal`; the helpers `createAccessor`, `ticks`, `niceDomain`,
`linePath`, `areaPath`, `arcPath`; `resolveTheme`; and `VD_CHARTS_VERSION`.
The entry MUST use named exports only (no `export default`), and the core
MUST NOT import `vue`.

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
`destroyAll`, `reinit`, `instances`, `optionsFromElement`, the `VanduoCharts`
namespace object, or the `__testing` bag, and importing any package file
MUST NOT read or write `window.VanduoCharts`, call `window.Vanduo.register`,
or scan the DOM for `data-vd-chart` attributes. The path/scale helpers that
`__testing` used to alias (`linePath`, `areaPath`, `arcPath`, `niceDomain`,
`ticks`) remain available as direct named exports.

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

### Requirement: charts version constant is 1.1.1

`VD_CHARTS_VERSION` SHALL be `'1.1.1'` (reset from the old line's `'0.2.0'` to
`'1.0.0'` at bundle launch, patch-bumped to `'1.0.1'` for the bar-baseline-clamp
fix, minor-bumped to `'1.1.0'` for the additive wrapper mark-click emits, then
patch-bumped to `'1.1.1'` for pie defaults and update/focus fixes)
and MUST equal `package.json` `version`.

#### Scenario: version constant matches the manifest

- **GIVEN** the charts core and `package.json`
- **WHEN** `VD_CHARTS_VERSION` is compared against `package.json` `version`
- **THEN** both are exactly `'1.1.1'`

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

The repo SHALL provide vitest coverage for the charts core and wrapper:
`createAccessor` (field, nested path, callback), the scales (`scaleLinear`
including `ticks`, `scaleBand` including `bandwidth`, `scalePoint`,
`scaleTime`, `scaleOrdinal` including cycling for unknown keys),
`niceDomain`/`ticks`, the path helpers (`linePath`, `areaPath` closing to the
baseline, `arcPath` donut vs pie arcs), factory option handling (defaults,
`innerRadiusRatio` presets, invalid-row filtering), and a `VdChart` mount
spec (mount creates the underlying chart in the container, prop change
re-renders, unmount destroys it). The suite MUST assert
`VD_CHARTS_VERSION === '1.1.1'` and that it equals `package.json` `version`. Scale/path/accessor specs SHALL run in a plain
Node environment (no DOM) to prove the primitives are runtime-agnostic;
factory rendering and mount specs run under jsdom.

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
- **THEN** the test fails unless both are exactly `'1.1.1'`

### Requirement: charts real-browser smoke coverage

The Playwright smoke suite SHALL include a charts spec running against a
harness page that imports the BUILT `dist/index.js` (ESM, with an
import map resolving the external `vue` specifier), adapted from the old
repo's `charts-harness.html`. It MUST assert real rendering for at least: a
bar chart (bars present, light tooltip on hover, click callback), a line and
area chart (non-empty path `d` attributes; area path closed with `Z`), and
donut vs pie inner-radius behavior (donut slice paths use two arc commands;
pie slice paths radiate from the chart center with a single outer arc).

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

The `VdChart` wrapper — and the typed convenience components `VdBarChart`, `VdLineChart`, `VdAreaChart`, `VdScatterChart`, `VdDonutChart`, `VdPieChart` — SHALL forward the framework-agnostic core's mark-click callbacks as an idiomatic kebab-case Vue emit family: `bar-click`, `point-click`, and `slice-click`. Each event MUST carry the core `ClickEvent` payload (`{ event, datum, index }`) unchanged. The wrapper SHALL pass `onBarClick` / `onPointClick` / `onSliceClick` into the core options as `(e) => emit('<name>', e)`; because the core fires only the callback relevant to the rendered chart type, all three MAY be passed unconditionally. The emits MUST be typed by a `VdChartEmits` interface exported from the package entry (payload `ClickEvent`). The framework-agnostic core (`core.js`) MUST NOT change — its `attachClick` wiring and `ClickEvent` shape already exist.

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

The chart SVG shell SHALL provide `role="graphics-document document"` and
`aria-roledescription="[kind] chart"` (or an explicit `ariaRoleDescription`).
An explicit `role` option SHALL override the shell's default graphics role; when
unset the default is unchanged. The Vue wrapper MUST expose this as `svgRole`
so the standard `role` attribute continues to fall through to the wrapper root.
Mark group containers SHALL provide
`role="graphics-object"` and an appropriate `aria-roledescription` (e.g.
`'data points'`, `'line series'`, `'grouped bars'`, `'pie slices'`). Individual
data marks (bars, points, slices) SHALL provide `role="graphics-symbol"` and an
`aria-roledescription` (`'bar'`, `'data point'`, or `'slice'`). Non-data
decorative elements (such as Cartesian axis lines and grid lines) SHALL have
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

When an interactive chart mark (an element with `tabindex="0"`) receives focus,
pressing `ArrowRight` or `ArrowDown` SHALL move keyboard focus to the next
mark in the chart, wrapping around to the first mark from the end. Pressing
`ArrowLeft` or `ArrowUp` SHALL move focus to the previous mark, wrapping around
to the last mark from the start. Pressing `Home` or `End` SHALL move focus
directly to the first or last mark. Moving focus to a mark SHALL update the
active tooltip to display that mark's data. Pressing `Escape` SHALL blur the
focused mark and dismiss the tooltip.

#### Scenario: roving arrow navigation and tooltip activation

- **GIVEN** a rendered bar chart with focus on the first bar
- **WHEN** the user presses `ArrowRight`
- **THEN** focus moves to the second bar, and the tooltip becomes visible
  displaying the second bar's data

### Requirement: accessible HTML data table fallback for screen readers

Every rendered chart SHALL generate an accessible HTML `<table>` summarizing its
data (`<caption>`, `<thead>` with `<th scope="col">`, and `<tbody>` with
`<th scope="row">` and `<td>`), fulfilling WCAG 1.1.1 Level A (techniques
G73/G74). The table SHALL be visually hidden by default using the
`.vd-chart-sr-only` class so that screen readers can navigate the data table
without altering visual page layout. Setting `options.dataTable: false` MUST
suppress table generation, and setting `options.dataTable: 'visible'` MUST
render the table visibly without `.vd-chart-sr-only`. Destroying the chart
instance MUST remove the data table from the target. For multi-series line/area
charts, table cells MUST match each row's x value using the same normalized key
as the x scale (timestamp for time, number for linear, string for point), so
per-series `Date` / object x values compare by value rather than by reference
and every series column is filled.

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

When no explicit `height` is supplied and `responsive` is not disabled, the
chart's measured height SHALL exclude the layout contribution of a visible data
table (`offsetHeight` plus vertical margins), so appending or growing the table
does not change the chart area. The `ResizeObserver` path MUST compare the
chart-area size (not raw `clientHeight`) so table-only growth does not trigger a
re-render, while a genuine container change still does. Visually hidden
(`.vd-chart-sr-only`) tables MUST contribute zero.

#### Scenario: table growth does not re-render the chart

- **GIVEN** a responsive chart with `dataTable: 'visible'` and no explicit height
- **WHEN** the visible table grows and the container grows by the same amount
- **THEN** the chart area is unchanged and no re-render is triggered

#### Scenario: a real container resize still re-renders

- **GIVEN** the same responsive chart
- **WHEN** the container height changes independently of the table
- **THEN** the chart re-renders once with the new size
