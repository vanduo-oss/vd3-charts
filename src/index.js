// Entry for `@vanduo-oss/vd3-charts`.
//
// The Vue wrapper family is the primary surface; the framework-agnostic core
// (factories, scales, helpers) is re-exported alongside. Named exports only.

export {
  VdChart,
  VdBarChart,
  VdLineChart,
  VdAreaChart,
  VdScatterChart,
  VdDonutChart,
  VdPieChart,
} from './vue.js';

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
} from './core.js';
