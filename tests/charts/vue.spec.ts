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

import { VdBarChart, VdChart } from '../../src/index.js';

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
});
