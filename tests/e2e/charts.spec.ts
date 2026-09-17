import { expect, test, type ConsoleMessage } from '@playwright/test';

// Real-browser packaging smoke: the fixture imports the BUILT dist ESM entry
// (/dist/index.js, with `vue` resolved locally via an import map) and
// renders bar / line / area / donut / pie through the framework-agnostic core
// factories. We assert SVG marks, path `d` attributes, donut-vs-pie inner-radius
// behavior, a light tooltip hover, bar clicks, and zero console errors.

interface ChartsWindow {
  __ready?: boolean;
  chartClicks: string[];
  chartsVersion: string;
  rasterizeNonWhite: (selector: string) => Promise<{ nonWhite: number; w: number; h: number }>;
  slicePathStats: (selector: string) => Array<{ d: string; arcs: number; fromCenter: boolean }>;
}

test.describe('charts smoke — built dist entry renders chart types', () => {
  const errors: string[] = [];

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto('/tests/e2e/fixtures/charts.html');
    await page.waitForFunction(() => (window as unknown as ChartsWindow).__ready === true);
  });

  test('renders one SVG bar per datum, each with positive height', async ({ page }) => {
    const bars = page.locator('#bar svg rect.vd-chart-bar');
    await expect(bars).toHaveCount(4);

    const heights = await bars.evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('height'))),
    );
    expect(heights.every((n) => n > 0)).toBe(true);
  });

  test('reports the built-entry version constant', async ({ page }) => {
    const version = await page.evaluate(() => (window as unknown as ChartsWindow).chartsVersion);
    expect(version).toBe('1.1.1');
  });

  test('rasterizes the chart to a non-blank canvas (getImageData)', async ({ page }) => {
    const result = await page.evaluate(() =>
      (window as unknown as ChartsWindow).rasterizeNonWhite('#bar'),
    );
    expect(result.w).toBe(640);
    expect(result.h).toBe(360);
    // colored bars + axes + labels ⇒ a substantial fraction of non-white pixels
    expect(result.nonWhite).toBeGreaterThan(1000);
  });

  test('forwards bar clicks through the built entry', async ({ page }) => {
    await page.locator('#bar svg rect.vd-chart-bar').first().click({ force: true });

    const clicks = await page.evaluate(() => (window as unknown as ChartsWindow).chartClicks);
    expect(clicks.length).toBeGreaterThan(0);
    expect(clicks[0]).toBe('Jan');
  });

  test('line and area charts expose non-empty path d attributes', async ({ page }) => {
    const line = page.locator('#line svg path.vd-chart-line-path');
    await expect(line).toHaveCount(1);
    const lineD = await line.getAttribute('d');
    expect(lineD).toBeTruthy();
    expect(lineD!.length).toBeGreaterThan(10);
    expect(lineD!.startsWith('M')).toBe(true);

    const area = page.locator('#area svg path.vd-chart-area-path');
    await expect(area).toHaveCount(1);
    const areaD = await area.getAttribute('d');
    expect(areaD).toBeTruthy();
    expect(areaD!.length).toBeGreaterThan(10);
    expect(areaD!.endsWith('Z')).toBe(true);

    // Area charts also stroke the upper boundary as a line path.
    await expect(page.locator('#area svg path.vd-chart-line-path')).toHaveCount(1);
  });

  test('donut slices use an inner arc; pie slices radiate from center', async ({ page }) => {
    await expect(page.locator('#donut svg path.vd-chart-slice')).toHaveCount(4);
    await expect(page.locator('#pie svg path.vd-chart-slice')).toHaveCount(4);

    const stats = await page.evaluate(() => {
      const w = window as unknown as ChartsWindow;
      return { donut: w.slicePathStats('#donut'), pie: w.slicePathStats('#pie') };
    });

    expect(stats.donut.every((s) => s.arcs === 2 && !s.fromCenter)).toBe(true);
    expect(stats.pie.every((s) => s.arcs === 1 && s.fromCenter)).toBe(true);
  });

  test('bar hover shows a light tooltip', async ({ page }) => {
    await page.locator('#bar svg rect.vd-chart-bar').first().hover({ force: true });
    const tooltip = page.locator('#bar .vd-chart-tooltip.is-visible');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Jan');
  });

  test.afterEach(() => {
    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
