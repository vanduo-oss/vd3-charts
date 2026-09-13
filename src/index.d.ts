/**
 * Type declarations for the `@vanduo-oss/vd3-charts` entry: the VdChart
 * Vue wrapper family (primary) plus the framework-agnostic core. Named
 * exports only.
 */

export {
  VdChart,
  VdBarChart,
  VdLineChart,
  VdAreaChart,
  VdScatterChart,
  VdDonutChart,
  VdPieChart,
} from './vue';
export type { VdChartType, VdChartAccessor, VdChartProps, VdChartEmits } from './vue';

export {
  BarChart,
  LineChart,
  AreaChart,
  ScatterChart,
  DonutChart,
  PieChart,
  scaleLinear,
  scaleTime,
  scaleBand,
  scalePoint,
  scaleOrdinal,
  createAccessor,
  ticks,
  niceDomain,
  linePath,
  areaPath,
  arcPath,
  resolveTheme,
  VD_CHARTS_VERSION,
} from './core';
export type {
  Row,
  Accessor,
  ColorOption,
  ChartTheme,
  AxisOptions,
  TooltipContext,
  TooltipOption,
  Series,
  LegendOptions,
  DataLabelsOption,
  Annotation,
  ClickEvent,
  BaseChartOptions,
  CartesianChartOptions,
  BarChartOptions,
  LineChartOptions,
  AreaChartOptions,
  ScatterChartOptions,
  PieChartOptions,
  ChartInstance,
  LinearScale,
  BandScale,
  PointScale,
  TimeScale,
  OrdinalScale,
} from './core';
