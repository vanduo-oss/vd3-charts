// @vitest-environment jsdom

// Feature coverage — annotations, data labels, axis labels, custom formatters,
// keyboard interaction, and tooltip content. These are all documented API
// features with zero prior test coverage.

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  PieChart,
  ScatterChart,
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
});

const BAR_ROWS = [
  { cat: 'a', val: 3 },
  { cat: 'b', val: 7 },
  { cat: 'c', val: 5 },
];

// ---------------------------------------------------------------------------
// Option/renderer parity — every documented option must actually reach the DOM
// ---------------------------------------------------------------------------

describe('option and renderer parity', () => {
  it('centerLabel: true renders the computed total, not the literal "true"', () => {
    const el = target();
    track(
      DonutChart({
        target: el,
        data: [
          { label: 'a', value: 3 },
          { label: 'b', value: 7 },
        ],
        label: 'label',
        value: 'value',
        centerLabel: true,
      }),
    );
    const texts = Array.from(el.querySelectorAll('text')).map((node) => node.textContent);
    expect(texts).not.toContain('true');
    expect(texts).toContain('10');
  });

  it('centerLabel: custom string wins; false hides the label', () => {
    const custom = target();
    track(
      DonutChart({
        target: custom,
        data: [{ label: 'a', value: 4 }],
        label: 'label',
        value: 'value',
        centerLabel: 'Revenue',
      }),
    );
    expect(Array.from(custom.querySelectorAll('text')).map((n) => n.textContent)).toContain(
      'Revenue',
    );

    const hidden = target();
    track(
      DonutChart({
        target: hidden,
        data: [{ label: 'a', value: 4 }],
        label: 'label',
        value: 'value',
        centerLabel: false,
      }),
    );
    expect(Array.from(hidden.querySelectorAll('text')).map((n) => n.textContent)).not.toContain(
      'total',
    );
  });

  it('xScale: "band" spreads points across a band instead of falling back to point', () => {
    const rows = [
      { k: 'a', v: 1 },
      { k: 'b', v: 2 },
      { k: 'c', v: 3 },
    ];
    const bandEl = target();
    track(LineChart({ target: bandEl, data: rows, x: 'k', y: 'v', xScale: 'band' }));
    const pointEl = target();
    track(LineChart({ target: pointEl, data: rows, x: 'k', y: 'v', xScale: 'point' }));

    const bandPath = bandEl.querySelector('path.vd-chart-line-path')?.getAttribute('d') ?? '';
    const pointPath = pointEl.querySelector('path.vd-chart-line-path')?.getAttribute('d') ?? '';
    expect(bandPath).not.toBe('');
    expect(pointPath).not.toBe('');
    // Band insets the series toward the plot edges; point centers the outer
    // categories on padding instead. The two paths must not be identical.
    expect(bandPath).not.toBe(pointPath);
  });

  it('multi-series area honors fill: false and a custom fill color', () => {
    const hidden = target();
    track(
      AreaChart({
        target: hidden,
        data: [
          { k: 'a', one: 1, two: 2 },
          { k: 'b', one: 2, two: 3 },
        ],
        x: 'k',
        series: [
          { name: 'one', y: 'one' },
          { name: 'two', y: 'two' },
        ],
        fill: false,
      }),
    );
    expect(hidden.querySelectorAll('path.vd-chart-area-path').length).toBe(0);

    const custom = target();
    track(
      AreaChart({
        target: custom,
        data: [
          { k: 'a', one: 1, two: 2 },
          { k: 'b', one: 2, two: 3 },
        ],
        x: 'k',
        series: [
          { name: 'one', y: 'one' },
          { name: 'two', y: 'two' },
        ],
        fill: '#123456',
      }),
    );
    const fills = Array.from(custom.querySelectorAll('path.vd-chart-area-path')).map((p) =>
      p.getAttribute('fill'),
    );
    expect(fills).toHaveLength(2);
    fills.forEach((fill) => expect(fill).toBe('#123456'));
  });

  it('a right legend is given its own gutter instead of overlapping the marks', () => {
    const rows = [
      { k: 'a', one: 1, two: 2 },
      { k: 'b', one: 2, two: 3 },
      { k: 'c', one: 3, two: 1 },
    ];
    const series = [
      { name: 'one', y: 'one' },
      { name: 'two', y: 'two' },
    ];

    const markXs = (el: HTMLElement): number[] =>
      Array.from(el.querySelectorAll('path.vd-chart-line-path')).flatMap((path) => {
        const numbers = (path.getAttribute('d') ?? '').match(/-?[\d.]+/g)?.map(Number) ?? [];
        return numbers.filter((_, index) => index % 2 === 0);
      });

    const withRight = target();
    track(
      LineChart({ target: withRight, data: rows, x: 'k', series, legend: { position: 'right' } }),
    );
    const withTop = target();
    track(LineChart({ target: withTop, data: rows, x: 'k', series, legend: { position: 'top' } }));

    // A right legend must take width away from the plot, so the marks shrink...
    const rightMax = Math.max(...markXs(withRight));
    const topMax = Math.max(...markXs(withTop));
    expect(rightMax).toBeLessThan(topMax);

    // ...and the legend itself must sit clear of the rightmost mark.
    const legendLabels = Array.from(withRight.querySelectorAll('g.vd-chart-legend text'));
    expect(legendLabels).toHaveLength(2);
    legendLabels.forEach((label) => {
      expect(parseFloat(label.getAttribute('x') ?? '0')).toBeGreaterThan(rightMax);
    });
  });

  it('without CSS.supports a misspelled field is not mistaken for a color', () => {
    const original = globalThis.CSS;
    // Simulate an environment with no CSS.supports (older SSR / minimal jsdom).
    vi.stubGlobal('CSS', undefined);
    try {
      const el = target();
      track(
        BarChart({
          target: el,
          data: [
            { cat: 'a', val: 1, group: 'x' },
            { cat: 'b', val: 2, group: 'y' },
          ],
          x: 'cat',
          y: 'val',
          color: 'gruop',
        }),
      );
      const fills = Array.from(el.querySelectorAll('rect.vd-chart-bar')).map((r) =>
        r.getAttribute('fill'),
      );
      expect(fills.length).toBeGreaterThan(0);
      fills.forEach((fill) => expect(fill).not.toBe('gruop'));
    } finally {
      vi.unstubAllGlobals();
      if (original !== undefined) vi.stubGlobal('CSS', original);
    }
    vi.unstubAllGlobals();
  });

  it('without CSS.supports a real CSS color keyword is still accepted', () => {
    vi.stubGlobal('CSS', undefined);
    try {
      const el = target();
      track(
        BarChart({
          target: el,
          data: [
            { cat: 'a', val: 1, group: 'x' },
            { cat: 'b', val: 2, group: 'y' },
          ],
          x: 'cat',
          y: 'val',
          color: 'rebeccapurple',
        }),
      );
      const fills = Array.from(el.querySelectorAll('rect.vd-chart-bar')).map((r) =>
        r.getAttribute('fill'),
      );
      expect(new Set(fills)).toEqual(new Set(['rebeccapurple']));
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

// ---------------------------------------------------------------------------
// Annotations
// ---------------------------------------------------------------------------

describe('annotations', () => {
  it('renders a horizontal reference line for annotations with y', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        annotations: [{ y: 5, label: 'Target' }],
      }),
    );
    const lines = el.querySelectorAll('.vd-chart-annotation-line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    // The annotation line should be horizontal — x1 < x2, y1 === y2
    const line = lines[0];
    const y1 = parseFloat(line.getAttribute('y1') ?? '0');
    const y2 = parseFloat(line.getAttribute('y2') ?? '0');
    expect(y1).toBe(y2);
  });

  it('renders a vertical reference line for annotations with x (category)', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        annotations: [{ x: 'b', label: 'Midpoint' }],
      }),
    );
    const lines = el.querySelectorAll('.vd-chart-annotation-line');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    // The annotation line should be vertical — x1 === x2, y1 < y2
    const line = lines[0];
    const x1 = parseFloat(line.getAttribute('x1') ?? '0');
    const x2 = parseFloat(line.getAttribute('x2') ?? '0');
    expect(x1).toBe(x2);
  });

  it('renders annotation labels as text', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        annotations: [{ y: 5, label: 'Threshold' }],
      }),
    );
    const annotations = el.querySelector('.vd-chart-annotations');
    expect(annotations).not.toBeNull();
    const textContent = annotations!.textContent;
    expect(textContent).toContain('Threshold');
  });

  it('uses a dashed stroke by default', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        annotations: [{ y: 5 }],
      }),
    );
    const line = el.querySelector('.vd-chart-annotation-line');
    expect(line).not.toBeNull();
    expect(line!.getAttribute('stroke-dasharray')).toBe('4 3');
  });

  it('uses a solid stroke when dash is false', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        annotations: [{ y: 5, dash: false }],
      }),
    );
    const line = el.querySelector('.vd-chart-annotation-line');
    expect(line).not.toBeNull();
    // When dash is false, stroke-dasharray should not be set (null).
    expect(line!.getAttribute('stroke-dasharray')).toBeNull();
  });

  it('renders on line charts too (not just bar)', () => {
    const el = target();
    track(
      LineChart({
        target: el,
        data: [
          { x: 0, y: 1 },
          { x: 1, y: 3 },
          { x: 2, y: 2 },
        ],
        x: 'x',
        y: 'y',
        annotations: [{ y: 2, label: 'Mean' }],
      }),
    );
    expect(el.querySelector('.vd-chart-annotations')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Data labels
// ---------------------------------------------------------------------------

describe('data labels', () => {
  it('renders a data label per bar when dataLabels is true', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        dataLabels: true,
      }),
    );
    const labels = el.querySelectorAll('.vd-chart-data-label');
    expect(labels).toHaveLength(3);
  });

  it('uses a custom format function for data label text', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        dataLabels: { format: (v: number) => `$${v}` },
      }),
    );
    const labels = el.querySelectorAll('.vd-chart-data-label');
    const texts = Array.from(labels).map((l) => l.textContent);
    expect(texts).toContain('$3');
    expect(texts).toContain('$7');
    expect(texts).toContain('$5');
  });

  it('renders data labels on scatter points when enabled', () => {
    const el = target();
    track(
      ScatterChart({
        target: el,
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
        x: 'x',
        y: 'y',
        dataLabels: true,
      }),
    );
    expect(el.querySelectorAll('.vd-chart-data-label')).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Axis labels
// ---------------------------------------------------------------------------

describe('axis labels', () => {
  it('renders xAxis.label text', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        xAxis: { label: 'Category' },
      }),
    );
    const svg = el.querySelector('svg')!;
    const allText = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent);
    expect(allText).toContain('Category');
  });

  it('renders yAxis.label text', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        yAxis: { label: 'Value' },
      }),
    );
    const svg = el.querySelector('svg')!;
    const allText = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent);
    expect(allText).toContain('Value');
  });
});

// ---------------------------------------------------------------------------
// Custom formatters
// ---------------------------------------------------------------------------

describe('custom tick formatters', () => {
  it('applies yFormat to y-axis tick labels', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        yFormat: (v: number) => `${v}€`,
      }),
    );
    const svg = el.querySelector('svg')!;
    const allText = Array.from(svg.querySelectorAll('.vd-chart-axes text')).map(
      (t) => t.textContent,
    );
    // At least one y tick should end with €
    expect(allText.some((t) => t?.endsWith('€'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Keyboard interaction
// ---------------------------------------------------------------------------

describe('keyboard interaction', () => {
  it('Enter key triggers the bar click callback', () => {
    const el = target();
    const clicks: unknown[] = [];
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        onBarClick: (e) => clicks.push(e),
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    bar.dispatchEvent(event);
    expect(clicks).toHaveLength(1);
  });

  it('Space key triggers the bar click callback', () => {
    const el = target();
    const clicks: unknown[] = [];
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        onBarClick: (e) => clicks.push(e),
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    bar.dispatchEvent(event);
    expect(clicks).toHaveLength(1);
  });

  it('other keys do not trigger the click callback', () => {
    const el = target();
    const clicks: unknown[] = [];
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        onBarClick: (e) => clicks.push(e),
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(clicks).toHaveLength(0);
  });

  it('interactive marks have tabindex="0"', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
      }),
    );
    const bars = el.querySelectorAll('rect.vd-chart-bar');
    Array.from(bars).forEach((bar) => {
      expect(bar.getAttribute('tabindex')).toBe('0');
    });
  });
});

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

describe('tooltip', () => {
  it('shows the tooltip element on pointerenter', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    bar.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    const tooltip = el.querySelector('.vd-chart-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.classList.contains('is-visible')).toBe(true);
    // Default tooltip content should include the category and value.
    expect(tooltip!.textContent).toContain('a');
    expect(tooltip!.textContent).toContain('3');
  });

  it('hides the tooltip on pointerleave', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    bar.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    bar.dispatchEvent(new Event('pointerleave', { bubbles: true }));
    const tooltip = el.querySelector('.vd-chart-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.classList.contains('is-visible')).toBe(false);
  });

  it('suppresses tooltip when tooltip: false', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        tooltip: false,
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    bar.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    // No tooltip element should be created.
    expect(el.querySelector('.vd-chart-tooltip')).toBeNull();
  });

  it('uses a custom tooltip function', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        tooltip: (datum: Record<string, unknown>) => `Custom: ${datum.cat}`,
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    bar.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    const tooltip = el.querySelector('.vd-chart-tooltip');
    expect(tooltip!.textContent).toBe('Custom: a');
  });

  it('tooltip has role="status" and aria-live="polite"', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
      }),
    );
    const bar = el.querySelector('rect.vd-chart-bar')!;
    bar.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    const tooltip = el.querySelector('.vd-chart-tooltip')!;
    expect(tooltip.getAttribute('role')).toBe('status');
    expect(tooltip.getAttribute('aria-live')).toBe('polite');
  });
});

// ---------------------------------------------------------------------------
// Donut center label
// ---------------------------------------------------------------------------

describe('donut center label', () => {
  it('renders the total in the donut center by default', () => {
    const el = target();
    track(
      DonutChart({
        target: el,
        data: [
          { label: 'a', value: 30 },
          { label: 'b', value: 70 },
        ],
        label: 'label',
        value: 'value',
      }),
    );
    const svg = el.querySelector('svg')!;
    const allText = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent);
    // The total (100) should appear in the center.
    expect(allText).toContain('100');
    expect(allText).toContain('total');
  });

  it('renders a custom centerLabel', () => {
    const el = target();
    track(
      DonutChart({
        target: el,
        data: [
          { label: 'a', value: 30 },
          { label: 'b', value: 70 },
        ],
        label: 'label',
        value: 'value',
        centerLabel: 'Revenue',
        centerSubLabel: '2025',
      }),
    );
    const svg = el.querySelector('svg')!;
    const allText = Array.from(svg.querySelectorAll('text')).map((t) => t.textContent);
    expect(allText).toContain('Revenue');
    expect(allText).toContain('2025');
  });
});

// ---------------------------------------------------------------------------
// Color option (CSS color strings, field names, callbacks) & Legend position
// ---------------------------------------------------------------------------

describe('color option and legend.position (v1.2.0)', () => {
  it('applies a CSS color string across bar, line, area, scatter, donut, and pie charts', () => {
    const barEl = target();
    track(BarChart({ target: barEl, data: BAR_ROWS, x: 'cat', y: 'val', color: '#40c057' }));
    expect(barEl.querySelector('rect.vd-chart-bar')?.getAttribute('fill')).toBe('#40c057');

    const lineEl = target();
    track(
      LineChart({
        target: lineEl,
        data: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
        x: 'x',
        y: 'y',
        color: '#f03e3e',
      }),
    );
    expect(lineEl.querySelector('path.vd-chart-line-path')?.getAttribute('stroke')).toBe('#f03e3e');

    const areaEl = target();
    track(
      AreaChart({
        target: areaEl,
        data: [
          { x: 0, y: 1 },
          { x: 1, y: 2 },
        ],
        x: 'x',
        y: 'y',
        color: 'rgb(16, 152, 173)',
      }),
    );
    expect(areaEl.querySelector('path.vd-chart-area-path')?.getAttribute('fill')).toBe(
      'rgb(16, 152, 173)',
    );

    const scatterEl = target();
    track(
      ScatterChart({
        target: scatterEl,
        data: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
        x: 'x',
        y: 'y',
        color: 'var(--vd-color-warning)',
      }),
    );
    expect(scatterEl.querySelector('circle.vd-chart-scatter-point')?.getAttribute('fill')).toBe(
      'var(--vd-color-warning)',
    );

    const donutEl = target();
    track(
      DonutChart({
        target: donutEl,
        data: [
          { label: 'a', value: 30, tone: '#7950f2' },
          { label: 'b', value: 70, tone: '#e64980' },
        ],
        label: 'label',
        value: 'value',
        color: (row) => String(row.tone),
      }),
    );
    const slices = donutEl.querySelectorAll('path.vd-chart-slice');
    expect(slices[0].getAttribute('fill')).toBe('#7950f2');
    expect(slices[1].getAttribute('fill')).toBe('#e64980');

    const pieEl = target();
    track(
      PieChart({
        target: pieEl,
        data: [
          { label: 'a', value: 30 },
          { label: 'b', value: 70 },
        ],
        label: 'label',
        value: 'value',
        color: '#fab005',
      }),
    );
    expect(pieEl.querySelector('path.vd-chart-slice')?.getAttribute('fill')).toBe('#fab005');
  });

  it('honors legend.position on donut and multi-series Cartesian charts', () => {
    const donutEl = target();
    track(
      DonutChart({
        target: donutEl,
        width: 640,
        height: 320,
        data: [
          { label: 'Desktop', value: 60 },
          { label: 'Mobile', value: 40 },
        ],
        legend: { position: 'top' },
      }),
    );
    const topLegendRect = donutEl.querySelector('.vd-chart-legend rect');
    expect(topLegendRect).not.toBeNull();
    // Top legend renders near plot.top - 22 (y < 30), whereas right legend renders near plot.right - 120
    expect(Number(topLegendRect!.getAttribute('y'))).toBeLessThan(30);

    const multiBarEl = target();
    track(
      BarChart({
        target: multiBarEl,
        width: 640,
        height: 320,
        data: [
          { cat: 'Q1', a: 10, b: 20 },
          { cat: 'Q2', a: 15, b: 25 },
        ],
        x: 'cat',
        series: [
          { name: 'Series A', y: 'a' },
          { name: 'Series B', y: 'b' },
        ],
        legend: { position: 'right' },
      }),
    );
    const rightLegendRect = multiBarEl.querySelector('.vd-chart-legend rect');
    expect(rightLegendRect).not.toBeNull();
    expect(Number(rightLegendRect!.getAttribute('x'))).toBeGreaterThan(400);
  });
});
