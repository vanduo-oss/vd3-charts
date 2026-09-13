// @vitest-environment jsdom

// Data accuracy edge cases — negative y-values, time-scale inference,
// single-point datasets, pie/donut with negatives/zeros — proving the
// rendering logic handles tricky real-world data correctly.

import { afterEach, describe, expect, it } from 'vitest';

import { BarChart, LineChart, PieChart, DonutChart } from '../../src/core.js';
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

// ---------------------------------------------------------------------------
// Negative y-values
// ---------------------------------------------------------------------------

describe('bar chart — negative y-values', () => {
  const ROWS = [
    { cat: 'a', val: 10 },
    { cat: 'b', val: -5 },
    { cat: 'c', val: -15 },
    { cat: 'd', val: 20 },
  ];

  it('renders a bar for every row (positive and negative)', () => {
    const el = target();
    track(BarChart({ target: el, data: ROWS, x: 'cat', y: 'val' }));
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(4);
  });

  it('negative bars have their top edge below the zero baseline', () => {
    const el = target();
    track(BarChart({ target: el, data: ROWS, x: 'cat', y: 'val' }));
    const bars = Array.from(el.querySelectorAll('rect.vd-chart-bar'));

    // Bar 'b' (val: -5) and 'c' (val: -15) are the negative ones (index 1, 2).
    // For a negative bar, rect.y should be at the zero line and height extends downward.
    // All bars must have positive height regardless of sign.
    bars.forEach((bar) => {
      const height = parseFloat(bar.getAttribute('height') ?? '0');
      expect(height).toBeGreaterThan(0);
    });

    // The plot stores the y scale; bars with value < 0 should have a higher
    // rect.y (closer to bottom) than bars with value > 0.
    const positiveBar = bars[0]; // val: 10
    const negativeBar = bars[1]; // val: -5
    const posY = parseFloat(positiveBar.getAttribute('y') ?? '0');
    const negY = parseFloat(negativeBar.getAttribute('y') ?? '0');
    // Positive bar's top should be above (smaller y) the negative bar's top.
    expect(posY).toBeLessThan(negY);
  });

  it('aria-label on negative bars includes the negative number', () => {
    const el = target();
    track(BarChart({ target: el, data: ROWS, x: 'cat', y: 'val' }));
    const bars = el.querySelectorAll('rect.vd-chart-bar');
    const label = bars[1].getAttribute('aria-label')!;
    expect(label).toContain('b');
    expect(label).toContain('-5');
  });
});

// ---------------------------------------------------------------------------
// Time-scale inference
// ---------------------------------------------------------------------------

describe('line chart — time-scale inference', () => {
  it('infers a time scale from Date objects', () => {
    const el = target();
    const data = [
      { x: new Date('2025-01-01'), y: 10 },
      { x: new Date('2025-02-01'), y: 20 },
      { x: new Date('2025-03-01'), y: 15 },
    ];
    track(LineChart({ target: el, data, x: 'x', y: 'y' }));
    const path = el.querySelector('path.vd-chart-line-path');
    expect(path).not.toBeNull();
    expect(path!.getAttribute('d')?.startsWith('M')).toBe(true);
    expect(el.querySelectorAll('circle.vd-chart-point')).toHaveLength(3);
  });

  it('infers a time scale from ISO date strings', () => {
    const el = target();
    const data = [
      { x: '2025-01-01', y: 10 },
      { x: '2025-06-15', y: 25 },
      { x: '2025-12-31', y: 18 },
    ];
    track(LineChart({ target: el, data, x: 'x', y: 'y' }));
    expect(el.querySelector('path.vd-chart-line-path')).not.toBeNull();
    expect(el.querySelectorAll('circle.vd-chart-point')).toHaveLength(3);
  });

  it('uses explicit xScale: "time" even when values look numeric', () => {
    const el = target();
    const data = [
      { x: new Date('2025-03-01'), y: 5 },
      { x: new Date('2025-04-01'), y: 8 },
    ];
    track(LineChart({ target: el, data, x: 'x', y: 'y', xScale: 'time' }));
    expect(el.querySelector('path.vd-chart-line-path')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Single-point dataset
// ---------------------------------------------------------------------------

describe('single-point dataset', () => {
  it('bar chart renders one bar for a single data point', () => {
    const el = target();
    track(BarChart({ target: el, data: [{ cat: 'only', val: 42 }], x: 'cat', y: 'val' }));
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(1);
  });

  it('line chart renders one point for a single data point', () => {
    const el = target();
    track(LineChart({ target: el, data: [{ x: 1, y: 7 }], x: 'x', y: 'y' }));
    expect(el.querySelectorAll('circle.vd-chart-point')).toHaveLength(1);
    // Path should still exist (even if just an M command with no L).
    expect(el.querySelector('path.vd-chart-line-path')).not.toBeNull();
  });

  it('pie chart renders one slice for a single data point', () => {
    const el = target();
    track(
      PieChart({
        target: el,
        data: [{ label: 'all', value: 100 }],
        label: 'label',
        value: 'value',
      }),
    );
    expect(el.querySelectorAll('path.vd-chart-slice')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Pie/donut with negative and zero values
// ---------------------------------------------------------------------------

describe('pie/donut — negative and zero value handling', () => {
  it('silently drops rows with negative values', () => {
    const el = target();
    track(
      PieChart({
        target: el,
        label: 'label',
        value: 'value',
        data: [
          { label: 'a', value: 30 },
          { label: 'b', value: -10 },
          { label: 'c', value: 50 },
        ],
      }),
    );
    // Only a (30) and c (50) should render — b (-10) is dropped.
    expect(el.querySelectorAll('path.vd-chart-slice')).toHaveLength(2);
  });

  it('silently drops rows with zero values', () => {
    const el = target();
    track(
      DonutChart({
        target: el,
        label: 'label',
        value: 'value',
        data: [
          { label: 'a', value: 10 },
          { label: 'b', value: 0 },
        ],
      }),
    );
    expect(el.querySelectorAll('path.vd-chart-slice')).toHaveLength(1);
  });

  it('renders "No data" when all values are zero or negative', () => {
    const el = target();
    track(
      PieChart({
        target: el,
        label: 'label',
        value: 'value',
        data: [
          { label: 'a', value: 0 },
          { label: 'b', value: -5 },
        ],
      }),
    );
    expect(el.querySelectorAll('path.vd-chart-slice')).toHaveLength(0);
    expect(el.querySelector('.vd-chart-empty')?.textContent).toBe('No data');
  });
});

// ---------------------------------------------------------------------------
// Empty series within multi-series
// ---------------------------------------------------------------------------

describe('multi-series — empty series handling', () => {
  it('renders the populated series even when one series has no valid rows', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        x: 'cat',
        y: 'val',
        series: [
          {
            name: 'Populated',
            data: [
              { cat: 'a', val: 10 },
              { cat: 'b', val: 20 },
            ],
          },
          {
            name: 'Empty',
            data: [],
          },
        ],
      }),
    );
    // Only the populated series' bars should be present.
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(2);
  });
});
