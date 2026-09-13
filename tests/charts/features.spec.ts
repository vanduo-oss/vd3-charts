// @vitest-environment jsdom

// Feature coverage — annotations, data labels, axis labels, custom formatters,
// keyboard interaction, and tooltip content. These are all documented API
// features with zero prior test coverage.

import { afterEach, describe, expect, it } from 'vitest';

import { BarChart, LineChart, ScatterChart, DonutChart } from '../../src/core.js';
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
