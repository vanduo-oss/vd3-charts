/**
 * Vue 3 wrappers for the vd3-charts component — the primary surface of
 * the `@vanduo-oss/vd3-charts` entry.
 *
 *   import { VdChart } from '@vanduo-oss/vd3-charts';
 *   <VdChart type="bar" :data="rows" x="month" y="sales" title="Sales" :height="300" />
 *
 * The sibling `./core.js` stays framework-agnostic. SSR-safe: the chart is
 * created on mount (client) into a plain container the server can pre-render.
 */
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { BarChart, LineChart, AreaChart, ScatterChart, DonutChart, PieChart } from './core.js';

const FACTORIES = {
  bar: BarChart,
  line: LineChart,
  area: AreaChart,
  scatter: ScatterChart,
  donut: DonutChart,
  pie: PieChart,
};

const CHART_PROPS = {
  type: { type: String, default: 'bar' },
  data: { type: Array, default: () => [] },
  x: { type: [String, Function], default: undefined },
  y: { type: [String, Function], default: undefined },
  label: { type: [String, Function], default: undefined },
  value: { type: [String, Function], default: undefined },
  // CSS color, category-field name, or per-datum function `(row) => color`.
  color: { type: [String, Function], default: undefined },
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  width: { type: Number, default: undefined },
  height: { type: Number, default: 300 },
  innerRadiusRatio: { type: Number, default: undefined },
  theme: { type: Object, default: undefined },
  tooltip: { type: [Function, String, Boolean], default: undefined },
  responsive: { type: Boolean, default: true },
  // Multi-series (bar → grouped, line/area → one path each).
  series: { type: Array, default: undefined },
  // `true` / `false` / `{ position }`.
  legend: { type: [Boolean, Object], default: undefined },
  // Value labels on marks: `true` / `false` / `{ format, color }`.
  dataLabels: { type: [Boolean, Object], default: undefined },
  // Reference lines: `[{ y?, x?, label?, color?, dash? }]`.
  annotations: { type: Array, default: undefined },
  // Axis range + ticks.
  xMin: { type: Number, default: undefined },
  xMax: { type: Number, default: undefined },
  yMin: { type: Number, default: undefined },
  yMax: { type: Number, default: undefined },
  yTickCount: { type: Number, default: undefined },
  yIncludeZero: { type: Boolean, default: undefined },
  xFormat: { type: Function, default: undefined },
  yFormat: { type: Function, default: undefined },
  xAxis: { type: Object, default: undefined },
  yAxis: { type: Object, default: undefined },
  // Accessible data table: `true` (sr-only, default) / `false` / `'visible'`.
  dataTable: { type: [Boolean, String], default: undefined },
  // Override the SVG `aria-roledescription` (defaults to `${kind} chart`).
  ariaRoleDescription: { type: String, default: undefined },
  // Avoid colliding with the standard root `role` fallthrough attribute.
  svgRole: { type: String, default: undefined },
};

function optionsFrom(target, props, emit) {
  return {
    target,
    type: props.type,
    data: props.data,
    x: props.x,
    y: props.y,
    label: props.label,
    value: props.value,
    color: props.color,
    title: props.title,
    description: props.description,
    width: props.width,
    height: props.height,
    innerRadiusRatio: props.innerRadiusRatio,
    theme: props.theme,
    tooltip: props.tooltip,
    responsive: props.responsive,
    series: props.series,
    legend: props.legend,
    dataLabels: props.dataLabels,
    annotations: props.annotations,
    xMin: props.xMin,
    xMax: props.xMax,
    yMin: props.yMin,
    yMax: props.yMax,
    yTickCount: props.yTickCount,
    yIncludeZero: props.yIncludeZero,
    xFormat: props.xFormat,
    yFormat: props.yFormat,
    xAxis: props.xAxis,
    yAxis: props.yAxis,
    dataTable: props.dataTable,
    ariaRoleDescription: props.ariaRoleDescription,
    role: props.svgRole,
    // Forward the core's mark-click callbacks as the Vue emit family. Passing
    // all three unconditionally is safe: the core only fires the callback
    // relevant to the rendered chart type (bars → onBarClick, points →
    // onPointClick, slices → onSliceClick).
    onBarClick: (e) => emit('bar-click', e),
    onPointClick: (e) => emit('point-click', e),
    onSliceClick: (e) => emit('slice-click', e),
  };
}

export const VdChart = defineComponent({
  name: 'VdChart',
  props: CHART_PROPS,
  // Mark clicks the core reports through its callbacks are re-emitted here as
  // idiomatic kebab-case Vue events carrying the core `ClickEvent` payload.
  emits: ['point-click', 'bar-click', 'slice-click'],
  setup(props, { emit }) {
    const el = ref(null);
    let instance = null;
    let currentType = props.type;

    const create = () => {
      const factory = FACTORIES[props.type] || BarChart;
      currentType = props.type;
      instance = factory(optionsFrom(el.value, props, emit));
    };

    onMounted(() => {
      if (typeof window === 'undefined' || !el.value) return;
      create();
    });

    watch(
      () => [
        props.type,
        props.data,
        props.x,
        props.y,
        props.label,
        props.value,
        props.color,
        props.title,
        props.description,
        props.width,
        props.height,
        props.innerRadiusRatio,
        props.theme,
        props.tooltip,
        props.responsive,
        props.series,
        props.legend,
        props.dataLabels,
        props.annotations,
        props.xMin,
        props.xMax,
        props.yMin,
        props.yMax,
        props.yTickCount,
        props.yIncludeZero,
        props.xFormat,
        props.yFormat,
        props.xAxis,
        props.yAxis,
        props.dataTable,
        props.ariaRoleDescription,
        props.svgRole,
      ],
      () => {
        if (!instance) return;
        // A different chart type needs a different renderer → recreate;
        // otherwise update options in place.
        if (props.type !== currentType) {
          instance.destroy();
          create();
        } else {
          instance.update(optionsFrom(el.value, props, emit));
        }
      },
      { deep: true },
    );

    onBeforeUnmount(() => {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    });

    return () =>
      h('div', {
        ref: el,
        class: 'vd-chart',
        style: props.height ? { minHeight: `${props.height}px` } : undefined,
      });
  },
});

function typed(name, type) {
  return defineComponent({
    name,
    props: CHART_PROPS,
    setup(props) {
      return () => h(VdChart, { ...props, type });
    },
  });
}

export const VdBarChart = typed('VdBarChart', 'bar');
export const VdLineChart = typed('VdLineChart', 'line');
export const VdAreaChart = typed('VdAreaChart', 'area');
export const VdScatterChart = typed('VdScatterChart', 'scatter');
export const VdDonutChart = typed('VdDonutChart', 'donut');
export const VdPieChart = typed('VdPieChart', 'pie');
