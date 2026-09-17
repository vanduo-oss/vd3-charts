// @vitest-environment jsdom

// Chart factory option handling + jsdom SVG rendering. jsdom has no canvas, but
// the charts core renders an <svg> DOM structure (it uses clientWidth /
// getBoundingClientRect, never getBBox/measureText), so the shell, marks, and
// axes are all inspectable here. Real-pixel rendering is covered by the
// Playwright charts smoke against the built dist entry. Also pins
// VD_CHARTS_VERSION and its package.json version sync, and exercises the
// window-branch of resolveTheme with a stubbed token cascade.

import { afterEach, describe, expect, it, vi } from 'vitest';

import pkg from '../../package.json';
import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  PieChart,
  ScatterChart,
  VD_CHARTS_VERSION,
  resolveTheme,
} from '../../src/core.js';
import type { ChartInstance } from '../../src/core';

const instances: ChartInstance[] = [];

function target(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function track(chart: ChartInstance): ChartInstance {
  instances.push(chart);
  return chart;
}

afterEach(() => {
  instances.splice(0).forEach((chart) => chart.destroy());
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

const BAR_ROWS = [
  { cat: 'a', val: 3 },
  { cat: 'b', val: 7 },
  { cat: 'c', val: 5 },
];

describe('chart factory — SVG shell', () => {
  it('renders an accessible svg into the target with the root classes', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('graphics-document document');
    expect(svg!.getAttribute('aria-roledescription')).toBe('bar chart');
    expect(el.classList.contains('vd-chart-root')).toBe(true);
    expect(el.classList.contains('vd-chart-bar')).toBe(true);
  });

  it('falls back to the default 640x360 size when the container has no measured box', () => {
    const el = target(); // jsdom clientWidth/clientHeight are 0
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('width')).toBe('640');
    expect(svg.getAttribute('height')).toBe('360');
    expect(svg.getAttribute('viewBox')).toBe('0 0 640 360');
  });

  it('honors explicit width/height and clamps to the minimum', () => {
    const el = target();
    track(BarChart({ target: el, width: 400, height: 200, data: BAR_ROWS, x: 'cat', y: 'val' }));
    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('width')).toBe('400');
    expect(svg.getAttribute('height')).toBe('200');

    const el2 = target();
    track(BarChart({ target: el2, width: 50, height: 10, data: BAR_ROWS, x: 'cat', y: 'val' }));
    const svg2 = el2.querySelector('svg.vd-chart-svg')!;
    expect(svg2.getAttribute('width')).toBe('160'); // clamped
    expect(svg2.getAttribute('height')).toBe('140'); // clamped
  });

  it('resolves a string selector target', () => {
    const el = target();
    el.id = 'chart-mount';
    track(BarChart({ target: '#chart-mount', data: BAR_ROWS, x: 'cat', y: 'val' }));
    expect(el.querySelector('svg.vd-chart-svg')).not.toBeNull();
  });

  it('throws for a missing selector target', () => {
    expect(() => BarChart({ target: '#does-not-exist', data: BAR_ROWS })).toThrow(
      /target not found/i,
    );
  });

  it('renders an accessible <title> when a title is provided', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val', title: 'Sales' }));
    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.querySelector('title')?.textContent).toBe('Sales');
    expect(svg.getAttribute('aria-labelledby')).toBeTruthy();
  });
});

describe('bar chart — marks and row filtering', () => {
  it('draws one bar per valid row', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(3);
  });

  it('filters rows with a null x or a non-finite y', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        x: 'cat',
        y: 'val',
        data: [
          { cat: 'a', val: 1 },
          { cat: 'b', val: null },
          { cat: 'c', val: 'not-a-number' },
          { cat: null, val: 5 },
        ],
      }),
    );
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(1);
  });

  it('renders a "No data" placeholder for an empty dataset', () => {
    const el = target();
    track(BarChart({ target: el, data: [], x: 'cat', y: 'val' }));
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(0);
    expect(el.querySelector('.vd-chart-empty')?.textContent).toBe('No data');
  });
});

describe('line / area / scatter charts', () => {
  const ROWS = [
    { x: 0, y: 1 },
    { x: 1, y: 3 },
    { x: 2, y: 2 },
  ];

  it('line chart draws a single line path', () => {
    const el = target();
    track(LineChart({ target: el, data: ROWS, x: 'x', y: 'y' }));
    const path = el.querySelector('path.vd-chart-line-path');
    expect(path).not.toBeNull();
    expect(path!.getAttribute('d')?.startsWith('M')).toBe(true);
    expect(el.querySelectorAll('circle.vd-chart-point')).toHaveLength(3);
  });

  it('area chart draws both an area fill and a line path', () => {
    const el = target();
    track(AreaChart({ target: el, data: ROWS, x: 'x', y: 'y' }));
    const area = el.querySelector('path.vd-chart-area-path');
    expect(area).not.toBeNull();
    expect(area!.getAttribute('d')?.endsWith('Z')).toBe(true); // closed to baseline
    expect(el.querySelector('path.vd-chart-line-path')).not.toBeNull();
  });

  it('scatter chart draws one point per row', () => {
    const el = target();
    track(ScatterChart({ target: el, data: ROWS, x: 'x', y: 'y' }));
    expect(el.querySelectorAll('circle.vd-chart-scatter-point')).toHaveLength(3);
  });
});

describe('donut vs pie — innerRadiusRatio presets', () => {
  const PIE_ROWS = [
    { label: 'a', value: 30 },
    { label: 'b', value: 70 },
  ];

  it('DonutChart defaults innerRadiusRatio to 0.62 and rings each slice', () => {
    const el = target();
    const chart = track(DonutChart({ target: el, data: PIE_ROWS, label: 'label', value: 'value' }));
    expect(chart.options.innerRadiusRatio).toBe(0.62);

    const slices = el.querySelectorAll('path.vd-chart-slice');
    expect(slices).toHaveLength(2);
    // a donut ring has an outer + inner arc → two "A" commands
    expect(slices[0].getAttribute('d')!.match(/A/g)).toHaveLength(2);
  });

  it('PieChart defaults innerRadiusRatio to 0 and draws slices from the center', () => {
    const el = target();
    const chart = track(PieChart({ target: el, data: PIE_ROWS, label: 'label', value: 'value' }));
    expect(chart.options.innerRadiusRatio).toBe(0);

    const slice = el.querySelector('path.vd-chart-slice')!;
    const d = slice.getAttribute('d')!;
    expect(d.startsWith('M')).toBe(true);
    // a pie wedge is a single arc back to the center → one "A" command
    expect(d.match(/A/g)).toHaveLength(1);
  });

  it('an explicit innerRadiusRatio overrides the factory default', () => {
    const el = target();
    const chart = track(
      DonutChart({
        target: el,
        data: PIE_ROWS,
        label: 'label',
        value: 'value',
        innerRadiusRatio: 0.4,
      }),
    );
    expect(chart.options.innerRadiusRatio).toBe(0.4);
  });
});

describe('chart lifecycle — update / resize / destroy', () => {
  it('update() re-renders with the merged options', () => {
    const el = target();
    const chart = track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(3);

    const returned = chart.update({ data: [{ cat: 'z', val: 9 }] });
    expect(returned).toBe(chart);
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(1);
  });

  it('resize() re-renders and returns the instance', () => {
    const el = target();
    const chart = track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));
    const returned = chart.resize();
    expect(returned).toBe(chart);
    expect(el.querySelector('svg.vd-chart-svg')).not.toBeNull();
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(3);
  });

  it('destroy() empties the container and removes the root classes', () => {
    const el = target();
    const chart = track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));
    chart.destroy();
    expect(el.querySelector('svg')).toBeNull();
    expect(el.innerHTML).toBe('');
    expect(el.classList.contains('vd-chart-root')).toBe(false);
    expect(el.classList.contains('vd-chart-bar')).toBe(false);
  });

  it('is a no-op to update or destroy after destroy (idempotent)', () => {
    const el = target();
    const chart = track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));
    chart.destroy();
    chart.update({ data: BAR_ROWS }); // guarded — must not re-render
    expect(el.querySelector('svg')).toBeNull();
    expect(() => chart.destroy()).not.toThrow();
  });
});

describe('resolveTheme — window branch (stubbed token cascade)', () => {
  function stubTokens(tokens: Record<string, string>): void {
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (name: string) => tokens[name] ?? '',
    }));
  }

  it('returns the built-in defaults when no tokens are defined', () => {
    stubTokens({});
    const theme = resolveTheme(target());
    expect(theme.textColor).toBe('#1a1d20');
    expect(theme.backgroundColor).toBe('#ffffff');
    expect(theme.colors[0]).toBe('#5c7cfa');
  });

  it('reads the --vd-chart-N palette slots', () => {
    stubTokens({ '--vd-chart-1': '#111111', '--vd-chart-2': '#222222' });
    const theme = resolveTheme(target());
    expect(theme.colors[0]).toBe('#111111');
    expect(theme.colors[1]).toBe('#222222');
  });

  it('falls back --vd-chart-1 → --vd-color-primary → --color-primary for slot 0', () => {
    stubTokens({ '--vd-color-primary': '#0a0a0a' });
    expect(resolveTheme(target()).colors[0]).toBe('#0a0a0a');

    stubTokens({ '--color-primary': '#abcabc' });
    expect(resolveTheme(target()).colors[0]).toBe('#abcabc');
  });

  it('reads --vd-text-primary for the text color', () => {
    stubTokens({ '--vd-text-primary': '#654321' });
    expect(resolveTheme(target()).textColor).toBe('#654321');
  });

  it('lets an explicit colors override win over the token cascade', () => {
    stubTokens({ '--vd-chart-1': '#111111' });
    const theme = resolveTheme(target(), { colors: ['#ff0000'] });
    expect(theme.colors).toEqual(['#ff0000']);
  });
});

describe('charts version constant', () => {
  it('VD_CHARTS_VERSION === "1.1.1"', () => {
    expect(VD_CHARTS_VERSION).toBe('1.1.1');
  });

  it('matches package.json version', () => {
    expect(pkg.version).toBe(VD_CHARTS_VERSION);
    expect(pkg.version).toBe('1.1.1');
  });
});
