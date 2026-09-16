import type { DefineComponent } from 'vue';
import type {
  Annotation,
  ClickEvent,
  ColorOption,
  DataLabelsOption,
  LegendOptions,
  Series,
  TooltipOption,
} from './core';

export type {
  TooltipContext,
  TooltipOption,
  Series,
  ColorOption,
  LegendOptions,
  DataLabelsOption,
  Annotation,
  ClickEvent,
} from './core';

/** Methods exposed by every chart component through a template ref. */
export interface VdChartExposed {
  /** Re-read CSS theme tokens and redraw; preserves logical mark focus. */
  refresh(): void;
}

export type VdChartType = 'bar' | 'line' | 'area' | 'scatter' | 'donut' | 'pie';

export type VdChartAccessor = string | ((row: Record<string, unknown>) => unknown);

export interface VdChartProps {
  /** Chart kind. Default `'bar'`. */
  type?: VdChartType;
  /** Row data; plain objects. */
  data?: Array<Record<string, unknown>>;
  /** Cartesian x accessor (key or function). */
  x?: VdChartAccessor;
  /** Cartesian y accessor (key or function). */
  y?: VdChartAccessor;
  /** Pie/donut label accessor. */
  label?: VdChartAccessor;
  /** Pie/donut value accessor. */
  value?: VdChartAccessor;
  /**
   * A CSS color, a category-field name (distinct values → palette), or a
   * per-datum function `(row) => color`.
   */
  color?: ColorOption;
  /** Rendered into SVG accessibility metadata. */
  title?: string;
  description?: string;
  width?: number;
  /** Container min-height in px. Default `300`. */
  height?: number;
  /** Donut/pie inner radius ratio. */
  innerRadiusRatio?: number;
  theme?: Record<string, unknown>;
  /** String, `false`, or a function receiving a typed `TooltipContext`. */
  tooltip?: TooltipOption;
  responsive?: boolean;
  /** Multiple series (bar → grouped, line/area → one path each). */
  series?: Series[];
  /** Show a legend; multi-series charts show one by default. */
  legend?: boolean | LegendOptions;
  /** Draw value labels on each mark. */
  dataLabels?: boolean | DataLabelsOption;
  /** Reference lines drawn across the plot. */
  annotations?: Annotation[];
  /** Pin axis bounds (otherwise auto-scaled to the data). */
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  /** Target number of y ticks (default 5). */
  yTickCount?: number;
  /** Force 0 into the y domain. */
  yIncludeZero?: boolean;
  /** Tick formatters. */
  xFormat?: (value: unknown) => string;
  yFormat?: (value: number) => string;
  /** Axis titles. */
  xAxis?: { label?: string };
  yAxis?: { label?: string };
  /** Accessible data table: `true` (sr-only, default) / `false` / `'visible'`. */
  dataTable?: boolean | 'visible';
  /** Override the SVG `aria-roledescription` (defaults to `${kind} chart`). */
  ariaRoleDescription?: string;
  /** Override the inner SVG graphics role without consuming the root `role` attribute. */
  svgRole?: string;
}

/**
 * Mark-click events. The wrapper forwards the core's click callbacks as
 * kebab-case Vue emits; each carries the core `ClickEvent` (`{ event, datum,
 * index }`). The core fires only the event relevant to the rendered chart
 * type — `bar-click` for bars, `point-click` for line/area/scatter points,
 * `slice-click` for pie/donut slices.
 */
export interface VdChartEmits {
  (event: 'point-click', payload: ClickEvent): void;
  (event: 'bar-click', payload: ClickEvent): void;
  (event: 'slice-click', payload: ClickEvent): void;
}

/* eslint-disable @typescript-eslint/no-empty-object-type -- DefineComponent filler params */
export declare const VdChart: DefineComponent<VdChartProps, {}, {}, {}, {}, {}, {}, VdChartEmits>;
export declare const VdBarChart: DefineComponent<
  VdChartProps,
  VdChartExposed,
  {},
  {},
  {},
  {},
  {},
  VdChartEmits
>;
export declare const VdLineChart: DefineComponent<
  VdChartProps,
  VdChartExposed,
  {},
  {},
  {},
  {},
  {},
  VdChartEmits
>;
export declare const VdAreaChart: DefineComponent<
  VdChartProps,
  VdChartExposed,
  {},
  {},
  {},
  {},
  {},
  VdChartEmits
>;
export declare const VdScatterChart: DefineComponent<
  VdChartProps,
  VdChartExposed,
  {},
  {},
  {},
  {},
  {},
  VdChartEmits
>;
export declare const VdDonutChart: DefineComponent<
  VdChartProps,
  VdChartExposed,
  {},
  {},
  {},
  {},
  {},
  VdChartEmits
>;
export declare const VdPieChart: DefineComponent<
  VdChartProps,
  VdChartExposed,
  {},
  {},
  {},
  {},
  {},
  VdChartEmits
>;
/* eslint-enable @typescript-eslint/no-empty-object-type */
