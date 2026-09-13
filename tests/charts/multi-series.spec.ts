// @vitest-environment jsdom

// Multi-series rendering coverage — grouped bar positioning, multi-line path
// count, multi-area fill + line paths, and legend rendering for series names.

import { afterEach, describe, expect, it } from 'vitest';

import { BarChart, LineChart, AreaChart } from '../../src/core.js';
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

const SERIES = [
  { name: 'Revenue', y: 'rev' as const },
  { name: 'Cost', y: 'cost' as const },
];

const SERIES_DATA = [
  { cat: 'Q1', rev: 30, cost: 20 },
  { cat: 'Q2', rev: 50, cost: 35 },
  { cat: 'Q3', rev: 40, cost: 25 },
];

// ---------------------------------------------------------------------------
// Multi-series bar chart (grouped)
// ---------------------------------------------------------------------------

describe('multi-series bar chart (grouped)', () => {
  it('renders bars for all series × categories', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    // 2 series × 3 categories = 6 bars
    expect(el.querySelectorAll('rect.vd-chart-bar')).toHaveLength(6);
  });

  it('grouped bars within a category have different x offsets', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    const bars = Array.from(el.querySelectorAll('rect.vd-chart-bar'));
    // Note: bars are rendered in series-major order (all Revenue, then all Cost),
    // so bars[0]=Revenue/Q1, bars[1]=Revenue/Q2, bars[2]=Revenue/Q3,
    // bars[3]=Cost/Q1, bars[4]=Cost/Q2, bars[5]=Cost/Q3.
    // Revenue/Q1 (bars[0]) vs Cost/Q1 (bars[3]) should be in the same band but different x offsets.
    const revQ1x = parseFloat(bars[0].getAttribute('x') ?? '0');
    const costQ1x = parseFloat(bars[3].getAttribute('x') ?? '0');
    expect(revQ1x).not.toBe(costQ1x);
  });

  it('renders a legend with series names by default', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    const legend = el.querySelector('.vd-chart-legend');
    expect(legend).not.toBeNull();
    // Legend should contain the series names
    const texts = Array.from(legend!.querySelectorAll('text')).map((t) => t.textContent);
    expect(texts).toContain('Revenue');
    expect(texts).toContain('Cost');
  });

  it('hides the legend when legend: false is set', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
        legend: false,
      }),
    );
    expect(el.querySelector('.vd-chart-legend')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Multi-series line chart
// ---------------------------------------------------------------------------

describe('multi-series line chart', () => {
  it('renders one line path per series', () => {
    const el = target();
    track(
      LineChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    const paths = el.querySelectorAll('path.vd-chart-line-path');
    expect(paths).toHaveLength(2);
    // Both paths should have valid d attributes.
    Array.from(paths).forEach((path) => {
      expect(path.getAttribute('d')?.startsWith('M')).toBe(true);
    });
  });

  it('renders points for all data points across series', () => {
    const el = target();
    track(
      LineChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    // 2 series × 3 points = 6 point circles
    expect(el.querySelectorAll('circle.vd-chart-point')).toHaveLength(6);
  });

  it('renders a legend by default', () => {
    const el = target();
    track(
      LineChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    expect(el.querySelector('.vd-chart-legend')).not.toBeNull();
  });

  it('each series line has a distinct stroke color', () => {
    const el = target();
    track(
      LineChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    const paths = el.querySelectorAll('path.vd-chart-line-path');
    const stroke0 = paths[0].getAttribute('stroke');
    const stroke1 = paths[1].getAttribute('stroke');
    expect(stroke0).not.toBe(stroke1);
    expect(stroke0).toBeTruthy();
    expect(stroke1).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Multi-series area chart
// ---------------------------------------------------------------------------

describe('multi-series area chart', () => {
  it('renders area fills and line paths per series', () => {
    const el = target();
    track(
      AreaChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    expect(el.querySelectorAll('path.vd-chart-area-path')).toHaveLength(2);
    expect(el.querySelectorAll('path.vd-chart-line-path')).toHaveLength(2);
  });

  it('area paths are closed (end with Z)', () => {
    const el = target();
    track(
      AreaChart({
        target: el,
        x: 'cat',
        data: SERIES_DATA,
        series: SERIES,
      }),
    );
    const areaPaths = el.querySelectorAll('path.vd-chart-area-path');
    Array.from(areaPaths).forEach((path) => {
      expect(path.getAttribute('d')?.endsWith('Z')).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Multi-series with per-series data
// ---------------------------------------------------------------------------

describe('multi-series with per-series data', () => {
  it('supports series with their own data arrays', () => {
    const el = target();
    track(
      LineChart({
        target: el,
        x: 'x',
        series: [
          {
            name: 'A',
            y: 'y',
            data: [
              { x: 1, y: 10 },
              { x: 2, y: 20 },
            ],
          },
          {
            name: 'B',
            y: 'y',
            data: [
              { x: 1, y: 5 },
              { x: 2, y: 15 },
              { x: 3, y: 25 },
            ],
          },
        ],
      }),
    );
    // 2 + 3 = 5 points total
    expect(el.querySelectorAll('circle.vd-chart-point')).toHaveLength(5);
    expect(el.querySelectorAll('path.vd-chart-line-path')).toHaveLength(2);
  });
});
