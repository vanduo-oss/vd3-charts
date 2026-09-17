// Type-level smoke test for the published @vanduo-oss/vd3-charts surface.
// Run via `pnpm test:types` (tsc --noEmit -p tests/types/tsconfig.json).
// Imports resolve the package's own "exports" map (self-reference) → the
// built dist/*.d.ts.

import {
  BarChart,
  LineChart,
  AreaChart,
  ScatterChart,
  DonutChart,
  PieChart,
  scaleLinear,
  scaleBand,
  scalePoint,
  scaleTime,
  scaleOrdinal,
  createAccessor,
  ticks,
  niceDomain,
  linePath,
  areaPath,
  arcPath,
  resolveTheme,
  VD_CHARTS_VERSION,
  VdChart,
  VdBarChart,
  VdLineChart,
  VdAreaChart,
  VdScatterChart,
  VdDonutChart,
  VdPieChart,
  type ChartInstance,
  type BarChartOptions,
  type LinearScale,
  type BandScale,
  type PointScale,
  type TimeScale,
  type OrdinalScale,
  type TooltipContext,
  type ClickEvent,
  type Row,
  type VdChartProps,
  type VdChartType,
  type VdChartEmits,
  type VdChartExposed,
} from '@vanduo-oss/vd3-charts';
import * as ChartsApi from '@vanduo-oss/vd3-charts';

interface Sale extends Row {
  month: string;
  value: number;
}
const sales: Sale[] = [
  { month: 'Jan', value: 120 },
  { month: 'Feb', value: 180 },
];

const bar: ChartInstance = BarChart<Sale>({
  target: '#bar',
  data: sales,
  x: 'month',
  y: (row) => row.value,
  role: 'graphics-object',
  barPadding: 0.2,
  tooltip: (datum: Sale, ctx: TooltipContext<Sale>) => `${datum.month}: ${ctx.value}`,
  onBarClick: (e: ClickEvent<Sale>) => void e.datum.value,
}).render();
bar.update({ title: 'x' }).resize().destroy();

const line: ChartInstance = LineChart<Sale>({ target: '#l', data: sales, points: true });
const area: ChartInstance = AreaChart<Sale>({ target: '#a', data: sales, fillOpacity: 0.3 });
const scatter: ChartInstance = ScatterChart<Sale>({ target: '#s', data: sales, pointRadius: 4 });
const donut: ChartInstance = DonutChart<Sale>({
  target: '#d',
  data: sales,
  label: 'month',
  value: 'value',
  innerRadiusRatio: 0.6,
});
const pie: ChartInstance = PieChart<Sale>({
  target: '#p',
  data: sales,
  label: 'month',
  value: 'value',
});

const barOpts: BarChartOptions<Sale> = { target: '#b', data: sales, x: 'month', y: 'value' };

const lin: LinearScale = scaleLinear({ domain: [0, 100], range: [0, 640] });
const y0: number | null = lin(50);
const linTicks: number[] = lin.ticks(5);
const band: BandScale = scaleBand({ domain: ['a', 'b'], range: [0, 100], padding: 0.2 });
const bw: number = band.bandwidth();
const point: PointScale = scalePoint({ domain: ['a', 'b'], range: [0, 100] });
const time: TimeScale = scaleTime({ domain: [new Date(), new Date()], range: [0, 100] });
const timeTicks: Date[] = time.ticks(4);
const ord: OrdinalScale = scaleOrdinal({ domain: ['a'], range: ['#f00'] });
const ordColor: string = ord('a');

const acc = createAccessor<Sale, number>('value', (r) => r.value);
const accValue: number = acc(sales[0]);
const tickVals: number[] = ticks(0, 100, 5);
const domain: [number, number] = niceDomain([1, 2, 3], { includeZero: true });
const lp: string = linePath([{ x: 0, y: 0 }]);
const ap: string = areaPath([{ x: 0, y: 0 }], 100);
const arc: string = arcPath(0, 0, 100, 60, 0, Math.PI);
const theme = resolveTheme(null, { textColor: '#000' });
const themeFont: string = theme.fontFamily;

const chartsVersion: string = VD_CHARTS_VERSION;

const chartProps: VdChartProps = {
  type: 'bar',
  data: [{ month: 'Jan', value: 1 }],
  x: 'month',
  y: (row) => row.value,
  innerRadiusRatio: 0.5,
  legend: { position: 'right' },
  svgRole: 'graphics-object',
};
const chartKind: VdChartType = 'donut';
// @ts-expect-error — `type` must be a VdChartType literal, not an arbitrary string.
const badChartProps: VdChartProps = { type: 'histogram' };

declare const chartEmit: VdChartEmits;
const aClick: ClickEvent<Sale> = { event: new Event('click'), datum: sales[0], index: 0 };
chartEmit('bar-click', aClick);
chartEmit('point-click', aClick);
chartEmit('slice-click', aClick);
// @ts-expect-error — 'wheel-click' is not a declared VdChart emit.
chartEmit('wheel-click', aClick);
// @ts-expect-error — the vanilla auto-init scanner (`init`) was excised.
ChartsApi.init?.(document.body);

void line;
void area;
void scatter;
void donut;
void pie;
void VdChart;
void VdBarChart;
void VdLineChart;
void VdAreaChart;
void VdScatterChart;
void VdDonutChart;
void VdPieChart;
void barOpts;
declare const genericChart: VdChartExposed;
genericChart.refresh();
void y0;
void linTicks;
void bw;
void point;
void timeTicks;
void ordColor;
void accValue;
void tickVals;
void domain;
void lp;
void ap;
void arc;
void themeFont;
void chartsVersion;
void chartProps;
void chartKind;
void badChartProps;
