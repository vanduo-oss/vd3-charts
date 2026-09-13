// @vitest-environment jsdom

// Regression: bar baselines must clamp into the rendered y-domain. With an
// explicit `yMin > 0` (which niceDomain honors), the old `yScale(0)` baseline
// extrapolated below the axis, so bars overflowed past the plot floor. The fix
// anchors the baseline to `yScale(clamp(0, yDomain))`, matching the area/line
// renderers. Geometry is inspectable under jsdom: the charts core renders an
// <svg> and records the plot box on the instance (`instance.plot`).

import { afterEach, describe, expect, it } from 'vitest';

import { BarChart } from '../../src/core.js';
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

/** Plot floor (bottom of the drawable area) recorded on the instance. */
function plotBottom(chart: ChartInstance): number {
  return (chart as unknown as { plot: { bottom: number } }).plot.bottom;
}

/** Bottom edge (y + height) of every rendered bar. */
function barBottoms(el: HTMLElement): number[] {
  return Array.from(el.querySelectorAll('rect.vd-chart-bar')).map((rect) => {
    const y = parseFloat(rect.getAttribute('y') ?? '0');
    const h = parseFloat(rect.getAttribute('height') ?? '0');
    return y + h;
  });
}

afterEach(() => {
  instances.splice(0).forEach((chart) => chart.destroy());
  document.body.replaceChildren();
});

describe('bar chart baseline — explicit yMin > 0 (regression)', () => {
  it('anchors single-series bars to the axis floor instead of overflowing past it', () => {
    const el = target();
    const chart = track(
      BarChart({
        target: el,
        x: 'cat',
        y: 'val',
        yMin: 10,
        data: [
          { cat: 'a', val: 20 },
          { cat: 'b', val: 50 },
        ],
      }),
    );

    const floor = plotBottom(chart);
    const bottoms = barBottoms(el);
    expect(bottoms).toHaveLength(2);
    for (const bottom of bottoms) {
      // No bar may extend below the plot floor — the old yScale(0) baseline did.
      expect(bottom).toBeLessThanOrEqual(floor + 0.5);
      // Every bar is anchored exactly to the axis floor.
      expect(bottom).toBeCloseTo(floor, 1);
    }
  });

  it('anchors grouped (multi-series) bars to the axis floor too', () => {
    const el = target();
    const chart = track(
      BarChart({
        target: el,
        x: 'cat',
        y: 'val',
        yMin: 10,
        series: [
          {
            name: 'S1',
            data: [
              { cat: 'a', val: 20 },
              { cat: 'b', val: 40 },
            ],
          },
          {
            name: 'S2',
            data: [
              { cat: 'a', val: 30 },
              { cat: 'b', val: 50 },
            ],
          },
        ],
      }),
    );

    const floor = plotBottom(chart);
    const bottoms = barBottoms(el);
    expect(bottoms).toHaveLength(4);
    for (const bottom of bottoms) {
      expect(bottom).toBeLessThanOrEqual(floor + 0.5);
      expect(bottom).toBeCloseTo(floor, 1);
    }
  });
});
