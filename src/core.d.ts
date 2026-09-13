/**
 * Type declarations for the vd3-charts core (the framework-agnostic
 * factory API). The Vue wrappers have their own `vue.d.ts`; both surfaces are
 * re-exported by the package `index.d.ts`.
 */

export type Row = Record<string, unknown>;

/** A field name (supports dotted paths) or an extractor function. */
export type Accessor<T = Row, R = unknown> = string | ((row: T) => R);

/**
 * Color option:
 *  - a CSS color string applied to every mark, OR a field name whose distinct
 *    values map to the theme's ordinal palette;
 *  - a function returning a CSS color per datum (e.g. `(row) => '#40c057'`).
 */
export type ColorOption<T = Row> = string | ((row: T) => string);

export interface ChartTheme {
  fontFamily: string;
  textColor: string;
  mutedTextColor: string;
  gridColor: string;
  axisColor: string;
  backgroundColor: string;
  colors: string[];
}

export interface AxisOptions {
  label?: string;
}

/** Context object passed to a function `tooltip`. */
export interface TooltipContext<T = Row> {
  datum: T;
  x?: unknown;
  y?: number;
  /** Numeric value of the mark (y for cartesian, slice value for pie/donut). */
  value?: number;
  /** Category label (bar x, pie/donut slice label). */
  label?: unknown;
  index?: number;
  /** Present for multi-series charts. */
  seriesIndex?: number;
  seriesName?: string;
}

export type TooltipOption<T = Row> =
  string | false | ((datum: T, context: TooltipContext<T>) => string | false);

/** One series in a multi-series cartesian chart (bar / line / area). */
export interface Series<T = Row> {
  name: string;
  /** y accessor for this series (falls back to the chart-level `y`). */
  y?: Accessor<T, number>;
  /** Per-series data (falls back to the chart-level `data`). */
  data?: T[];
  /** Explicit color; defaults to the next theme palette slot. */
  color?: string;
}

export interface LegendOptions {
  position?: 'top' | 'right';
}

export interface DataLabelsOption {
  /** Format the value shown (defaults to the chart's number formatting). */
  format?: (value: number) => string;
  color?: string;
}

export interface Annotation {
  /** Horizontal reference line at this y value. */
  y?: number;
  /** Vertical reference line at this x value (numeric or category). */
  x?: number | string;
  label?: string;
  color?: string;
  /** Dashed by default; set `false` for a solid line. */
  dash?: boolean;
}

export interface ClickEvent<T = Row> {
  event: Event;
  datum: T;
  index: number;
}

export interface BaseChartOptions<T = Row> {
  /** Element or CSS selector to render into. */
  target: string | Element;
  data?: T[];
  title?: string;
  description?: string;
  ariaLabel?: string;
  width?: number;
  height?: number;
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  theme?: Partial<ChartTheme>;
  tooltip?: TooltipOption<T>;
  /** Re-render on container resize (default true). */
  responsive?: boolean;
  /** Show a legend. Multi-series charts show one by default; pass `false` to hide. */
  legend?: boolean | LegendOptions;
  /** Draw value labels on each mark. */
  dataLabels?: boolean | DataLabelsOption;
  /** Accessible data table fallback for screen readers (WCAG 1.1.1). Set `false` to disable or `'visible'` to display visually. Default is `true` (visually hidden). */
  dataTable?: boolean | 'visible';
  /** Custom ARIA role description override for the chart root (defaults to `${kind} chart`). */
  ariaRoleDescription?: string;
  /** Override the SVG WAI-ARIA graphics role (defaults to `graphics-document document`). */
  role?: string;
}

export interface CartesianChartOptions<T = Row> extends BaseChartOptions<T> {
  x?: Accessor<T>;
  y?: Accessor<T, number>;
  color?: ColorOption<T>;
  xScale?: 'linear' | 'time' | 'point';
  xFormat?: (value: unknown) => string;
  yFormat?: (value: number) => string;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  /** Pin axis bounds (otherwise auto-scaled to the data). */
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  /** Target number of y ticks (default 5). */
  yTickCount?: number;
  /** Force 0 into the y domain. */
  yIncludeZero?: boolean;
  /** Multiple series (bar → grouped, line/area → one path each). */
  series?: Series<T>[];
  /** Reference lines drawn across the plot. */
  annotations?: Annotation[];
  onPointClick?: (e: ClickEvent<T>) => void;
}

export interface BarChartOptions<T = Row> extends CartesianChartOptions<T> {
  /** Band padding between bars/groups (default 0.18). */
  barPadding?: number;
  onBarClick?: (e: ClickEvent<T>) => void;
}

export interface LineChartOptions<T = Row> extends CartesianChartOptions<T> {
  stroke?: string;
  strokeWidth?: number;
  points?: boolean;
  pointRadius?: number;
  pointFill?: string;
}

export interface AreaChartOptions<T = Row> extends LineChartOptions<T> {
  fill?: string;
  fillOpacity?: number;
}

export interface ScatterChartOptions<T = Row> extends CartesianChartOptions<T> {
  pointRadius?: number;
  pointOpacity?: number;
}

export interface PieChartOptions<T = Row> extends BaseChartOptions<T> {
  label?: Accessor<T>;
  value?: Accessor<T, number>;
  innerRadiusRatio?: number;
  centerLabel?: string | false;
  centerSubLabel?: string;
  onSliceClick?: (e: ClickEvent<T>) => void;
}

export interface ChartInstance {
  kind: string;
  options: Record<string, unknown>;
  target: Element;
  render(): ChartInstance;
  update(options?: Record<string, unknown>): ChartInstance;
  resize(): ChartInstance;
  destroy(): void;
  showTooltip(content: string, event?: Event): void;
  hideTooltip(): void;
}

export function BarChart<T = Row>(options: BarChartOptions<T>): ChartInstance;
export function LineChart<T = Row>(options: LineChartOptions<T>): ChartInstance;
export function AreaChart<T = Row>(options: AreaChartOptions<T>): ChartInstance;
export function ScatterChart<T = Row>(options: ScatterChartOptions<T>): ChartInstance;
export function DonutChart<T = Row>(options: PieChartOptions<T>): ChartInstance;
export function PieChart<T = Row>(options: PieChartOptions<T>): ChartInstance;

// --- scales & helpers ---

export interface LinearScale {
  (value: number): number | null;
  domain(): [number, number];
  range(): [number, number];
  ticks(count?: number): number[];
}

export interface BandScale {
  (value: unknown): number | null;
  domain(): string[];
  range(): [number, number];
  bandwidth(): number;
  step(): number;
}

export interface PointScale {
  (value: unknown): number | null;
  domain(): string[];
  range(): [number, number];
  bandwidth(): number;
  step(): number;
}

export interface TimeScale {
  (value: unknown): number | null;
  domain(): Date[];
  range(): [number, number];
  ticks(count?: number): Date[];
}

export type OrdinalScale = ((value: unknown) => string) & {
  domain(): string[];
  range(): string[];
};

export function scaleLinear(config?: {
  domain?: [number, number];
  range?: [number, number];
}): LinearScale;
export function scaleTime(config?: { domain?: unknown[]; range?: [number, number] }): TimeScale;
export function scaleBand(config?: {
  domain?: unknown[];
  range?: [number, number];
  padding?: number;
  paddingInner?: number;
  paddingOuter?: number;
}): BandScale;
export function scalePoint(config?: {
  domain?: unknown[];
  range?: [number, number];
  padding?: number;
}): PointScale;
export function scaleOrdinal(config?: { domain?: unknown[]; range?: string[] }): OrdinalScale;

export function createAccessor<T = Row, R = unknown>(
  accessor: Accessor<T, R> | undefined,
  fallback?: Accessor<T, R>,
): (row: T) => R;

export function resolveTheme(target: Element | null, overrides?: Partial<ChartTheme>): ChartTheme;

export function ticks(min: number, max: number, count?: number): number[];

/**
 * Compute a "nice" [min, max] domain. Pass a boolean for the legacy
 * `includeZero` shorthand, or an options object; an explicit `min`/`max`
 * pins that bound exactly.
 */
export function niceDomain(
  values: unknown[],
  options?: boolean | { includeZero?: boolean; min?: number; max?: number; tickCount?: number },
): [number, number];

export function linePath(points: Array<{ x: number; y: number }>): string;
export function areaPath(points: Array<{ x: number; y: number }>, baselineY: number): string;
export function arcPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string;

export const VD_CHARTS_VERSION: string;
