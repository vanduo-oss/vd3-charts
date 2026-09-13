// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BarChart, LineChart, ScatterChart, PieChart } from '../../src/core.js';
import type { ChartInstance } from '../../src/core.js';

let container: HTMLElement;
const tracked: ChartInstance[] = [];

function target(): HTMLElement {
  const el = document.createElement('div');
  container.appendChild(el);
  return el;
}

function track(instance: ChartInstance): ChartInstance {
  tracked.push(instance);
  return instance;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  while (tracked.length) {
    try {
      tracked.pop()!.destroy();
    } catch {
      // ignore
    }
  }
  container.remove();
});

const BAR_ROWS = [
  { cat: 'Jan', val: 100 },
  { cat: 'Feb', val: 200 },
  { cat: 'Mar', val: 150 },
];

const MULTI_SERIES = [
  {
    name: '2024',
    data: [
      { x: 'Q1', y: 10 },
      { x: 'Q2', y: 20 },
    ],
  },
  {
    name: '2025',
    data: [
      { x: 'Q1', y: 15 },
      { x: 'Q2', y: 25 },
    ],
  },
];

// ===========================================================================
// 1. WAI-ARIA Graphics Module 1.0 Semantics
// ===========================================================================

describe('a11y — WAI-ARIA Graphics Module roles & structure', () => {
  it('svg shell has role="graphics-document document" and aria-roledescription', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('role')).toBe('graphics-document document');
    expect(svg.getAttribute('aria-roledescription')).toBe('bar chart');
  });

  it('supports custom ariaRoleDescription override', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        ariaRoleDescription: 'monthly sales chart',
      }),
    );

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('aria-roledescription')).toBe('monthly sales chart');
  });

  it('supports a custom graphics role override', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        role: 'graphics-object',
      }),
    );

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('role')).toBe('graphics-object');
  });

  it('bar chart has role="graphics-object" on markGroup and role="graphics-symbol" on bars', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const markGroup = el.querySelector('g.vd-chart-marks')!;
    expect(markGroup).not.toBeNull();
    expect(markGroup.getAttribute('role')).toBe('graphics-object');
    expect(markGroup.getAttribute('aria-roledescription')).toBe('data points');

    const bars = el.querySelectorAll('rect.vd-chart-bar');
    expect(bars.length).toBe(3);
    bars.forEach((bar) => {
      expect(bar.getAttribute('role')).toBe('graphics-symbol');
      expect(bar.getAttribute('aria-roledescription')).toBe('bar');
      expect(bar.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('line chart marks have graphics roles and descriptions', () => {
    const el = target();
    track(LineChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('aria-roledescription')).toBe('line chart');

    const markGroup = el.querySelector('g.vd-chart-marks')!;
    expect(markGroup.getAttribute('role')).toBe('graphics-object');
    expect(markGroup.getAttribute('aria-roledescription')).toBe('line series');

    const points = el.querySelectorAll('circle.vd-chart-point');
    expect(points.length).toBe(3);
    points.forEach((point) => {
      expect(point.getAttribute('role')).toBe('graphics-symbol');
      expect(point.getAttribute('aria-roledescription')).toBe('data point');
    });
  });

  it('scatter chart marks have graphics roles and descriptions', () => {
    const el = target();
    track(
      ScatterChart({
        target: el,
        data: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      }),
    );

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('aria-roledescription')).toBe('scatter chart');

    const markGroup = el.querySelector('g.vd-chart-marks')!;
    expect(markGroup.getAttribute('role')).toBe('graphics-object');
    expect(markGroup.getAttribute('aria-roledescription')).toBe('data points');

    const points = el.querySelectorAll('circle.vd-chart-scatter-point');
    expect(points.length).toBe(2);
    points.forEach((point) => {
      expect(point.getAttribute('role')).toBe('graphics-symbol');
      expect(point.getAttribute('aria-roledescription')).toBe('data point');
    });
  });

  it('pie/donut chart marks have graphics roles and descriptions', () => {
    const el = target();
    track(PieChart({ target: el, data: BAR_ROWS, label: 'cat', value: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    expect(svg.getAttribute('aria-roledescription')).toBe('pie chart');

    const markGroup = el.querySelector('g.vd-chart-marks')!;
    expect(markGroup.getAttribute('role')).toBe('graphics-object');
    expect(markGroup.getAttribute('aria-roledescription')).toBe('pie slices');

    const slices = el.querySelectorAll('path.vd-chart-slice');
    expect(slices.length).toBe(3);
    slices.forEach((slice) => {
      expect(slice.getAttribute('role')).toBe('graphics-symbol');
      expect(slice.getAttribute('aria-roledescription')).toBe('slice');
    });
  });

  it('multi-series grouped bar chart has graphics roles', () => {
    const el = target();
    track(BarChart({ target: el, series: MULTI_SERIES }));

    const markGroup = el.querySelector('g.vd-chart-marks')!;
    expect(markGroup.getAttribute('role')).toBe('graphics-object');
    expect(markGroup.getAttribute('aria-roledescription')).toBe('grouped bars');

    const bars = el.querySelectorAll('rect.vd-chart-bar');
    expect(bars.length).toBe(4);
    bars.forEach((bar) => {
      expect(bar.getAttribute('role')).toBe('graphics-symbol');
      expect(bar.getAttribute('aria-roledescription')).toBe('bar');
    });
  });

  it('axes and gridlines are marked aria-hidden="true"', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const axesGroup = el.querySelector('g.vd-chart-axes')!;
    expect(axesGroup).not.toBeNull();
    expect(axesGroup.getAttribute('aria-hidden')).toBe('true');
  });

  it('annotations group has role="graphics-object" and aria-roledescription="annotations"', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        annotations: [{ y: 120, label: 'Threshold' }],
      }),
    );

    const annGroup = el.querySelector('g.vd-chart-annotations')!;
    expect(annGroup).not.toBeNull();
    expect(annGroup.getAttribute('role')).toBe('graphics-object');
    expect(annGroup.getAttribute('aria-roledescription')).toBe('annotations');
  });
});

// ===========================================================================
// 2. Keyboard Arrow Navigation
// ===========================================================================

describe('a11y — keyboard arrow navigation', () => {
  it('navigates through bars with ArrowRight and ArrowLeft', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    const bars = Array.from(el.querySelectorAll('rect.vd-chart-bar')) as SVGRectElement[];
    expect(bars.length).toBe(3);

    // Focus the first bar
    bars[0].focus();
    expect(document.activeElement).toBe(bars[0]);

    // Press ArrowRight -> moves to second bar
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(bars[1]);

    // Press ArrowRight -> moves to third bar
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(bars[2]);

    // Press ArrowRight on last bar -> wraps to first bar
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(bars[0]);

    // Press ArrowLeft on first bar -> wraps to last bar
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(bars[2]);

    // Press ArrowUp -> moves to previous bar (bar 1)
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(bars[1]);

    // Press ArrowDown -> moves to next bar (bar 2)
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(bars[2]);
  });

  it('supports Home and End keys to jump to first and last marks', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    const bars = Array.from(el.querySelectorAll('rect.vd-chart-bar')) as SVGRectElement[];

    bars[1].focus();
    expect(document.activeElement).toBe(bars[1]);

    // Press Home -> moves to first mark
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(bars[0]);

    // Press End -> moves to last mark
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(bars[2]);
  });

  it('arrow navigation triggers tooltip on the focused mark', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    const bars = Array.from(el.querySelectorAll('rect.vd-chart-bar')) as SVGRectElement[];

    // Focus first bar
    bars[0].focus();
    const tooltip = el.querySelector('.vd-chart-tooltip')!;
    expect(tooltip).not.toBeNull();
    expect(tooltip.classList.contains('is-visible')).toBe(true);
    expect(tooltip.textContent).toContain('Jan');

    // Arrow to second bar
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(bars[1]);
    expect(tooltip.textContent).toContain('Feb');
  });

  it('Escape key blurs the active mark and hides tooltip', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' }));

    const svg = el.querySelector('svg.vd-chart-svg')!;
    const bars = Array.from(el.querySelectorAll('rect.vd-chart-bar')) as SVGRectElement[];

    bars[0].focus();
    expect(document.activeElement).toBe(bars[0]);

    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).not.toBe(bars[0]);
    const tooltip = el.querySelector('.vd-chart-tooltip')!;
    expect(tooltip.classList.contains('is-visible')).toBe(false);
  });
});

// ===========================================================================
// 3. Accessible HTML Data Table Fallback (WCAG 1.1.1)
// ===========================================================================

describe('a11y — accessible HTML data table fallback', () => {
  it('generates a visually-hidden data table by default for a bar chart', () => {
    const el = target();
    track(BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val', title: 'Sales 2024' }));

    const table = el.querySelector('table.vd-chart-data-table');
    expect(table).not.toBeNull();
    expect(table!.classList.contains('vd-chart-sr-only')).toBe(true);

    const caption = table!.querySelector('caption');
    expect(caption?.textContent).toBe('Sales 2024');

    const headers = Array.from(table!.querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers).toEqual(['Category', 'Value']);

    const rows = Array.from(table!.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(3);

    const firstRowCells = Array.from(rows[0].querySelectorAll('th, td')).map(
      (cell) => cell.textContent,
    );
    expect(firstRowCells).toEqual(['Jan', '100']);
  });

  it('generates a multi-series data table with series columns', () => {
    const el = target();
    track(BarChart({ target: el, series: MULTI_SERIES }));

    const table = el.querySelector('table.vd-chart-data-table')!;
    expect(table).not.toBeNull();

    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers).toEqual(['Category', '2024', '2025']);

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(2);

    const q1Cells = Array.from(rows[0].querySelectorAll('th, td')).map((c) => c.textContent);
    expect(q1Cells).toEqual(['Q1', '10', '15']);
  });

  it('fills every series cell for per-series Date x values', () => {
    const el = target();
    const jan = new Date('2024-01-01T00:00:00Z');
    const feb = new Date('2024-02-01T00:00:00Z');
    track(
      LineChart({
        target: el,
        series: [
          {
            name: 'A',
            data: [
              { x: new Date(jan), y: 1 },
              { x: new Date(feb), y: 2 },
            ],
          },
          {
            name: 'B',
            data: [
              { x: new Date(jan), y: 3 },
              { x: new Date(feb), y: 4 },
            ],
          },
        ],
      }),
    );

    const table = el.querySelector('table.vd-chart-data-table')!;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows).toHaveLength(2);
    const cells = rows.map((row) =>
      Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent),
    );
    expect(cells).toEqual([
      [expect.any(String), '1', '3'],
      [expect.any(String), '2', '4'],
    ]);
  });

  it('generates a data table for pie chart with percentage', () => {
    const el = target();
    track(
      PieChart({
        target: el,
        data: [
          { fruit: 'Apple', count: 40 },
          { fruit: 'Banana', count: 60 },
        ],
        label: 'fruit',
        value: 'count',
      }),
    );

    const table = el.querySelector('table.vd-chart-data-table')!;
    expect(table).not.toBeNull();

    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers).toEqual(['Category', 'Value', 'Percentage']);

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(2);

    const firstCells = Array.from(rows[0].querySelectorAll('th, td')).map((c) => c.textContent);
    expect(firstCells).toEqual(['Apple', '40', '40%']);
  });

  it('generates a data table for scatter chart', () => {
    const el = target();
    track(
      ScatterChart({
        target: el,
        data: [
          { x: 5, y: 10 },
          { x: 15, y: 20 },
        ],
      }),
    );

    const table = el.querySelector('table.vd-chart-data-table')!;
    expect(table).not.toBeNull();

    const rows = Array.from(table.querySelectorAll('tbody tr'));
    expect(rows.length).toBe(2);
  });

  it('suppresses table when dataTable: false', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        dataTable: false,
      }),
    );

    expect(el.querySelector('table.vd-chart-data-table')).toBeNull();
  });

  it('renders visible table (without vd-chart-sr-only) when dataTable: "visible"', () => {
    const el = target();
    track(
      BarChart({
        target: el,
        data: BAR_ROWS,
        x: 'cat',
        y: 'val',
        dataTable: 'visible',
      }),
    );

    const table = el.querySelector('table.vd-chart-data-table');
    expect(table).not.toBeNull();
    expect(table!.classList.contains('vd-chart-sr-only')).toBe(false);
  });

  it('removes data table on instance.destroy()', () => {
    const el = target();
    const chart = BarChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val' });
    expect(el.querySelector('table.vd-chart-data-table')).not.toBeNull();

    chart.destroy();
    expect(el.querySelector('table.vd-chart-data-table')).toBeNull();
  });
});

// ===========================================================================
// 4. Responsive sizing excludes the visible data table
// ===========================================================================

describe('a11y — responsive sizing ignores visible data-table growth', () => {
  it('accounts for a visible table on first render and ignores an sr-only table', () => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLTableElement.prototype,
      'offsetHeight',
    );
    Object.defineProperty(HTMLTableElement.prototype, 'offsetHeight', {
      configurable: true,
      get: () => 100,
    });

    try {
      const fixedTarget = () => {
        const el = target();
        Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => 400 });
        Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => 600 });
        return el;
      };

      const visibleEl = fixedTarget();
      track(
        LineChart({
          target: visibleEl,
          data: BAR_ROWS,
          x: 'cat',
          y: 'val',
          dataTable: 'visible',
        }),
      );
      expect(visibleEl.querySelector('svg')?.getAttribute('height')).toBe('300');

      const hiddenEl = fixedTarget();
      track(LineChart({ target: hiddenEl, data: BAR_ROWS, x: 'cat', y: 'val' }));
      expect(hiddenEl.querySelector('svg')?.getAttribute('height')).toBe('400');

      const exhaustedEl = fixedTarget();
      Object.defineProperty(HTMLTableElement.prototype, 'offsetHeight', {
        configurable: true,
        get: () => 400,
      });
      track(
        LineChart({
          target: exhaustedEl,
          data: BAR_ROWS,
          x: 'cat',
          y: 'val',
          dataTable: 'visible',
        }),
      );
      expect(exhaustedEl.querySelector('svg')?.getAttribute('height')).toBe('140');
    } finally {
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLTableElement.prototype, 'offsetHeight', originalOffsetHeight);
      } else {
        delete (HTMLTableElement.prototype as unknown as { offsetHeight?: number }).offsetHeight;
      }
    }
  });

  it('does not re-render when only the visible table grows, but does on a real resize', () => {
    type ROCallback = (entries: unknown[]) => void;
    let roCallback: ROCallback = () => {};
    const OriginalRO = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    class MockResizeObserver {
      constructor(cb: ROCallback) {
        roCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = MockResizeObserver;

    try {
      const el = target();
      let clientHeight = 320;
      Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => clientHeight });
      Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => 400 });

      const chart = track(
        LineChart({ target: el, data: BAR_ROWS, x: 'cat', y: 'val', dataTable: 'visible' }),
      );

      let renders = 0;
      const originalRender = chart.render.bind(chart);
      chart.render = () => {
        renders += 1;
        return originalRender();
      };

      const table = el.querySelector('table.vd-chart-data-table')!;
      Object.defineProperty(table, 'offsetHeight', { configurable: true, get: () => 120 });

      // The table grew, and the container grew by exactly the same amount, so
      // the chart area is unchanged and no re-render should happen.
      clientHeight += 120;
      roCallback([]);
      expect(renders).toBe(0);

      // A real container change shrinks the chart area -> re-render once.
      clientHeight = 200;
      roCallback([]);
      expect(renders).toBe(1);
    } finally {
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = OriginalRO;
    }
  });
});
