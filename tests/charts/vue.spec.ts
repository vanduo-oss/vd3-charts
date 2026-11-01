// @vitest-environment jsdom

// Vue wrapper mount spec for <VdChart> (and one typed sub-component). Runs in
// jsdom against the SVG DOM the charts core renders. Asserts the wrapper wires
// props into the underlying core (creating the chart in its own container),
// that a data prop change updates in place, a type change recreates the chart,
// and that unmount destroys the instance (emptying the container). Imports the
// public package entry so the re-export surface is exercised too.
//
// Mark clicks: the wrapper forwards the core's click callbacks as the Vue emit
// family (`bar-click` / `point-click` / `slice-click`), each carrying the core
// `ClickEvent` payload — the final describe block pins that forwarding.

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { VdBarChart, VdChart, VdPieChart } from '../../src/index.js';

const wrappers: VueWrapper[] = [];
function mountChart(props: Record<string, unknown>, attrs: Record<string, unknown> = {}) {
  const wrapper = mount(VdChart, { props, attrs });
  wrappers.push(wrapper);
  return wrapper;
}

afterEach(() => {
  while (wrappers.length) wrappers.pop()!.unmount();
});

const ROWS = [
  { cat: 'a', val: 3 },
  { cat: 'b', val: 7 },
  { cat: 'c', val: 5 },
];

describe('VdChart wrapper — mount', () => {
  it('creates the chart into its own container on mount', () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' });
    expect(wrapper.classes()).toContain('vd-chart');
    // core added its root classes to the same container element
    expect(wrapper.classes()).toContain('vd-chart-root');
    expect(wrapper.classes()).toContain('vd-chart-bar');
    expect(wrapper.find('svg.vd-chart-svg').exists()).toBe(true);
  });

  it('passes data/accessor props through so one bar renders per row', () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' });
    expect(wrapper.findAll('rect.vd-chart-bar')).toHaveLength(3);
  });

  it('flows the title prop into the svg accessibility metadata', () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val', title: 'Q1' });
    expect(wrapper.find('svg title').text()).toBe('Q1');
  });

  it('renders the container even with no data (empty placeholder inside)', () => {
    const wrapper = mountChart({ type: 'bar', data: [], x: 'cat', y: 'val' });
    expect(wrapper.find('svg.vd-chart-svg').exists()).toBe(true);
    expect(wrapper.find('.vd-chart-empty').text()).toBe('No data');
  });
});

describe('VdChart wrapper — reactive updates', () => {
  it('updates in place when a data prop changes (same chart type)', async () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' });
    expect(wrapper.findAll('rect.vd-chart-bar')).toHaveLength(3);

    await wrapper.setProps({ data: [{ cat: 'z', val: 9 }] });

    expect(wrapper.findAll('rect.vd-chart-bar')).toHaveLength(1);
    // still the same chart kind
    expect(wrapper.classes()).toContain('vd-chart-bar');
  });

  it('recreates the chart when the type prop changes', async () => {
    const wrapper = mountChart({
      type: 'bar',
      data: [
        { cat: 0, val: 1 },
        { cat: 1, val: 3 },
        { cat: 2, val: 2 },
      ],
      x: 'cat',
      y: 'val',
    });
    expect(wrapper.classes()).toContain('vd-chart-bar');

    await wrapper.setProps({ type: 'line' });

    expect(wrapper.classes()).toContain('vd-chart-line');
    expect(wrapper.classes()).not.toContain('vd-chart-bar');
    expect(wrapper.find('path.vd-chart-line-path').exists()).toBe(true);
  });

  it('reacts to dataTable changes after mount', async () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' });
    expect(wrapper.find('table.vd-chart-data-table').exists()).toBe(true);
    expect(wrapper.find('table.vd-chart-data-table').classes()).toContain('vd-chart-sr-only');

    await wrapper.setProps({ dataTable: 'visible' });
    expect(wrapper.find('table.vd-chart-data-table').classes()).not.toContain('vd-chart-sr-only');

    await wrapper.setProps({ dataTable: false });
    expect(wrapper.find('table.vd-chart-data-table').exists()).toBe(false);
  });

  it('reacts to ariaRoleDescription and svgRole without consuming the root role', async () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' }, { role: 'region' });
    const svg = () => wrapper.find('svg.vd-chart-svg').element;

    expect(wrapper.attributes('role')).toBe('region');
    expect(svg().getAttribute('role')).toBe('graphics-document document');

    await wrapper.setProps({ ariaRoleDescription: 'sales chart', svgRole: 'graphics-object' });

    expect(wrapper.attributes('role')).toBe('region');
    expect(svg().getAttribute('aria-roledescription')).toBe('sales chart');
    expect(svg().getAttribute('role')).toBe('graphics-object');
  });
});

describe('VdChart wrapper — unmount', () => {
  it('destroys the chart and empties the container on unmount', () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' });
    const container = wrapper.find('div.vd-chart').element;
    expect(container.querySelector('svg')).not.toBeNull();

    wrapper.unmount();

    expect(container.querySelector('svg')).toBeNull();
    expect(container.innerHTML).toBe('');
  });
});

describe('VdChart wrapper — mark click emits', () => {
  type ClickPayload = { event: Event; datum: Record<string, unknown>; index: number };

  const NUM = [
    { a: 1, b: 2 },
    { a: 2, b: 5 },
    { a: 3, b: 4 },
  ];

  it('emits bar-click carrying the ClickEvent when a bar is clicked', async () => {
    const wrapper = mountChart({ type: 'bar', data: ROWS, x: 'cat', y: 'val' });
    await wrapper.find('rect.vd-chart-bar').trigger('click');

    const events = wrapper.emitted('bar-click');
    expect(events).toHaveLength(1);
    const payload = events![0][0] as ClickPayload;
    expect(payload.datum).toEqual(ROWS[0]);
    expect(payload.index).toBe(0);
    expect(payload.event).toBeInstanceOf(Event);
    // The unrelated mark-click channels stay silent for a bar chart.
    expect(wrapper.emitted('point-click')).toBeUndefined();
    expect(wrapper.emitted('slice-click')).toBeUndefined();
  });

  it('emits point-click when a scatter point is clicked', async () => {
    const wrapper = mountChart({ type: 'scatter', data: NUM, x: 'a', y: 'b' });
    await wrapper.find('circle.vd-chart-scatter-point').trigger('click');

    const events = wrapper.emitted('point-click');
    expect(events).toHaveLength(1);
    const payload = events![0][0] as ClickPayload;
    expect(payload.datum).toEqual(NUM[0]);
    expect(payload.index).toBe(0);
  });

  it('emits slice-click when a pie slice is clicked', async () => {
    const wrapper = mountChart({ type: 'pie', data: ROWS, label: 'cat', value: 'val' });
    await wrapper.find('path.vd-chart-slice').trigger('click');

    const events = wrapper.emitted('slice-click');
    expect(events).toHaveLength(1);
    const payload = events![0][0] as ClickPayload;
    expect(payload.datum).toEqual(ROWS[0]);
    expect(payload.index).toBe(0);
  });
});

describe('typed chart wrapper — VdBarChart', () => {
  it('forwards its fixed type into VdChart and renders bars', () => {
    const wrapper = mount(VdBarChart, { props: { data: ROWS, x: 'cat', y: 'val' } });
    wrappers.push(wrapper);
    expect(wrapper.find('svg.vd-chart-svg').exists()).toBe(true);
    expect(wrapper.findAll('rect.vd-chart-bar')).toHaveLength(3);
  });

  it('forwards bar-click emits from typed wrapper', async () => {
    const wrapper = mount(VdBarChart, { props: { data: ROWS, x: 'cat', y: 'val' } });
    wrappers.push(wrapper);
    await wrapper.find('rect.vd-chart-bar').trigger('click');
    expect(wrapper.emitted('bar-click')).toHaveLength(1);
  });
});

describe('VdChart wrapper — full core prop parity (v1.2.0)', () => {
  it('forwards line/area mark styling props (stroke, strokeWidth, points, pointRadius, pointFill, fill, fillOpacity)', async () => {
    const wrapper = mountChart({
      type: 'area',
      data: [
        { x: 0, y: 10 },
        { x: 1, y: 20 },
      ],
      x: 'x',
      y: 'y',
      stroke: '#e03131',
      strokeWidth: 4,
      points: true,
      pointRadius: 6,
      pointFill: '#1971c2',
      fill: '#fcc419',
      fillOpacity: 0.45,
    });

    const line = wrapper.get('path.vd-chart-line-path');
    expect(line.attributes('stroke')).toBe('#e03131');
    expect(line.attributes('stroke-width')).toBe('4');

    const area = wrapper.get('path.vd-chart-area-path');
    expect(area.attributes('fill')).toBe('#fcc419');
    expect(area.attributes('opacity')).toBe('0.45');

    const point = wrapper.get('circle.vd-chart-point');
    expect(point.attributes('r')).toBe('6');
    expect(point.attributes('fill')).toBe('#1971c2');

    await wrapper.setProps({ points: false, strokeWidth: 2 });
    expect(wrapper.findAll('circle.vd-chart-point')).toHaveLength(0);
    expect(wrapper.get('path.vd-chart-line-path').attributes('stroke-width')).toBe('2');
  });

  it('forwards scatter pointFill and pointOpacity props', () => {
    const wrapper = mountChart({
      type: 'scatter',
      data: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
      x: 'x',
      y: 'y',
      pointRadius: 7,
      pointFill: '#2f9e44',
      pointOpacity: 0.6,
    });
    const pt = wrapper.get('circle.vd-chart-scatter-point');
    expect(pt.attributes('r')).toBe('7');
    expect(pt.attributes('fill')).toBe('#2f9e44');
    expect(pt.attributes('opacity')).toBe('0.6');
  });

  it('forwards donut centerLabel and centerSubLabel props and updates reactively', async () => {
    const wrapper = mountChart({
      type: 'donut',
      data: [
        { label: 'A', value: 40 },
        { label: 'B', value: 60 },
      ],
      centerLabel: '99.9%',
      centerSubLabel: 'uptime',
    });
    expect(wrapper.text()).toContain('99.9%');
    expect(wrapper.text()).toContain('uptime');

    await wrapper.setProps({ centerLabel: '100%', centerSubLabel: 'SLA' });
    expect(wrapper.text()).toContain('100%');
    expect(wrapper.text()).toContain('SLA');
  });

  it('forwards ariaLabel, margin, barPadding, and xScale props', () => {
    const wrapper = mountChart({
      type: 'bar',
      data: ROWS,
      x: 'cat',
      y: 'val',
      ariaLabel: 'Custom accessible bar chart',
      margin: { top: 30, right: 20, bottom: 40, left: 60 },
      barPadding: 0.35,
      xScale: 'band',
    });
    expect(wrapper.get('svg.vd-chart-svg').attributes('aria-label')).toBe(
      'Custom accessible bar chart',
    );
    expect(wrapper.findAll('rect.vd-chart-bar')).toHaveLength(3);
  });
});

describe('Vue pie defaults', () => {
  it.each([VdChart, VdPieChart])(
    'keeps the center filled when radius is absent or removed',
    async (component) => {
      const wrapper = mount(component, {
        props: {
          type: 'pie',
          data: [
            { label: 'A', value: 2 },
            { label: 'B', value: 3 },
          ],
        },
      });
      wrappers.push(wrapper);
      const arcs = () => (wrapper.get('.vd-chart-slice').attributes('d').match(/A/g) ?? []).length;
      expect(arcs()).toBe(1);
      await wrapper.setProps({ innerRadiusRatio: 0.5 });
      expect(arcs()).toBe(2);
      await wrapper.setProps({ innerRadiusRatio: undefined });
      expect(arcs()).toBe(1);
    },
  );

  it('keeps the donut hole when radius is absent', () => {
    const wrapper = mountChart({
      type: 'donut',
      data: [
        { label: 'A', value: 2 },
        { label: 'B', value: 3 },
      ],
    });
    expect(wrapper.get('.vd-chart-slice').attributes('d').match(/A/g)).toHaveLength(2);
  });
});
