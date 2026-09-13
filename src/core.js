const SVG_NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const ARC_EPSILON = 0.0001;
const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 360;
const DEFAULT_MARGIN = { top: 28, right: 24, bottom: 46, left: 56 };
const POLAR_MARGIN = { top: 32, right: 24, bottom: 28, left: 24 };
const DEFAULT_COLORS = [
  '#5c7cfa',
  '#228be6',
  '#40c057',
  '#fab005',
  '#fa5252',
  '#12b886',
  '#be4bdb',
  '#fd7e14',
];

export const VD_CHARTS_VERSION = '1.1.0';

let chartId = 0;

function nextId(prefix) {
  chartId += 1;
  return `${prefix}-${chartId}`;
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isElement(value) {
  return hasWindow() && value instanceof Element;
}

function resolveTarget(target) {
  if (!hasWindow()) {
    throw new Error('Vanduo Charts requires a browser DOM target.');
  }
  if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (!el) throw new Error(`Chart target not found: ${target}`);
    return el;
  }
  if (isElement(target)) return target;
  throw new Error('Chart target must be an Element or selector string.');
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== null && typeof value !== 'undefined') {
      el.setAttribute(key, String(value));
    }
  });
  return el;
}

function append(parent, child) {
  parent.appendChild(child);
  return child;
}

function setText(parent, text) {
  parent.textContent = text == null ? '' : String(text);
  return parent;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const key = String(value);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });
  return result;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function toNumber(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toTime(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isDateLike(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime());
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || /^-?\d+(\.\d+)?$/.test(trimmed)) return false;
  return Number.isFinite(Date.parse(trimmed));
}

function readPathValue(source, path) {
  if (source == null) return undefined;
  if (!String(path).includes('.')) return source[path];
  return String(path)
    .split('.')
    .reduce((value, key) => {
      if (value == null) return undefined;
      return value[key];
    }, source);
}

export function createAccessor(accessor, fallback) {
  const resolved = accessor == null ? fallback : accessor;
  if (typeof resolved === 'function') return resolved;
  if (typeof resolved === 'string' && resolved.length) {
    return (datum) => readPathValue(datum, resolved);
  }
  return (datum) => datum;
}

function normalizeMargin(value, fallback = DEFAULT_MARGIN) {
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value };
  }
  return {
    top: Number(value?.top ?? fallback.top),
    right: Number(value?.right ?? fallback.right),
    bottom: Number(value?.bottom ?? fallback.bottom),
    left: Number(value?.left ?? fallback.left),
  };
}

function dataTableContribution(target) {
  if (!isElement(target) || typeof target.querySelectorAll !== 'function') return 0;
  let total = 0;
  target.querySelectorAll('.vd-chart-data-table:not(.vd-chart-sr-only)').forEach((table) => {
    const style = typeof getComputedStyle === 'function' ? getComputedStyle(table) : null;
    const marginTop = style ? parseFloat(style.marginTop) || 0 : 0;
    const marginBottom = style ? parseFloat(style.marginBottom) || 0 : 0;
    total += (table.offsetHeight || 0) + marginTop + marginBottom;
  });
  return total;
}

function measureTarget(target, options) {
  const width = Number(options.width) || Math.round(target.clientWidth) || DEFAULT_WIDTH;
  const targetHeight = Math.round(Number(target.clientHeight));
  const availableHeight = Math.max(0, targetHeight - dataTableContribution(target));
  const height = Number(options.height) || (targetHeight > 0 ? availableHeight : DEFAULT_HEIGHT);
  return {
    width: Math.max(160, width),
    height: Math.max(140, height),
  };
}

function getPlotBox(width, height, margin) {
  return {
    left: margin.left,
    top: margin.top,
    right: Math.max(margin.left + 1, width - margin.right),
    bottom: Math.max(margin.top + 1, height - margin.bottom),
  };
}

function readToken(style, names, fallback) {
  for (const name of names) {
    const value = style.getPropertyValue(name).trim();
    if (value) return value;
  }
  return fallback;
}

export function resolveTheme(target, overrides = {}) {
  if (!hasWindow()) {
    return {
      fontFamily: 'inherit',
      textColor: '#1a1d20',
      mutedTextColor: '#868e96',
      gridColor: '#e9ecef',
      axisColor: '#ced4da',
      backgroundColor: '#ffffff',
      colors: DEFAULT_COLORS.slice(),
      ...overrides,
    };
  }

  const styleTarget = isElement(target) ? target : document.documentElement;
  const style = getComputedStyle(styleTarget);
  const rootStyle = getComputedStyle(document.documentElement);
  const tokenStyle = {
    getPropertyValue(name) {
      return style.getPropertyValue(name) || rootStyle.getPropertyValue(name);
    },
  };

  const colors = DEFAULT_COLORS.map((fallback, index) =>
    readToken(
      tokenStyle,
      [
        `--vd-chart-${index + 1}`,
        index === 0 ? '--vd-color-primary' : '',
        index === 1 ? '--vd-color-info' : '',
        index === 2 ? '--vd-color-success' : '',
        index === 3 ? '--vd-color-warning' : '',
        index === 4 ? '--vd-color-error' : '',
        index === 0 ? '--color-primary' : '',
        index === 1 ? '--color-info' : '',
        index === 2 ? '--color-success' : '',
      ].filter(Boolean),
      fallback,
    ),
  );

  return {
    fontFamily: readToken(tokenStyle, ['--vd-font-family-base'], 'inherit'),
    textColor: readToken(tokenStyle, ['--vd-text-primary', '--text-primary'], '#1a1d20'),
    mutedTextColor: readToken(tokenStyle, ['--vd-text-muted', '--text-muted'], '#868e96'),
    gridColor: readToken(
      tokenStyle,
      ['--vd-border-color-light', '--border-color-light', '--vd-border-color'],
      '#e9ecef',
    ),
    axisColor: readToken(tokenStyle, ['--vd-border-color', '--border-color'], '#ced4da'),
    backgroundColor: readToken(tokenStyle, ['--vd-bg-primary', '--bg-primary'], '#ffffff'),
    ...overrides,
    colors: overrides.colors || colors,
  };
}

function tickStep(min, max, count) {
  const span = Math.abs(max - min);
  if (!span || !Number.isFinite(span)) return 1;
  const raw = span / Math.max(1, count);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const error = raw / power;
  const factor = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1;
  return factor * power;
}

export function ticks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const reverse = max < min;
  const start = reverse ? max : min;
  const stop = reverse ? min : max;
  const step = tickStep(start, stop, count);
  const first = Math.ceil(start / step) * step;
  const values = [];
  for (let value = first; value <= stop + step / 2; value += step) {
    values.push(Number(value.toFixed(12)));
  }
  return reverse ? values.reverse() : values;
}

/**
 * Compute a "nice" [min, max] domain.
 * @param {Array} values
 * @param {boolean | { includeZero?: boolean, min?: number, max?: number, tickCount?: number }} [options]
 *   Pass a boolean for the legacy `includeZero` shorthand, or an options object.
 *   An explicit `min`/`max` pins that bound exactly (no nice-rounding).
 */
export function niceDomain(values, options = false) {
  const opts = typeof options === 'boolean' ? { includeZero: options } : options || {};
  const nums = values.map(toNumber).filter(isFiniteNumber);
  if (!nums.length) {
    return [isFiniteNumber(opts.min) ? opts.min : 0, isFiniteNumber(opts.max) ? opts.max : 1];
  }
  let min = Math.min(...nums);
  let max = Math.max(...nums);

  if (opts.includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (isFiniteNumber(opts.min)) min = opts.min;
  if (isFiniteNumber(opts.max)) max = opts.max;

  if (min === max) {
    const pad = Math.abs(min || 1) * 0.1;
    min -= pad;
    max += pad;
  }

  const step = tickStep(min, max, opts.tickCount || 5);
  return [
    isFiniteNumber(opts.min) ? opts.min : Math.floor(min / step) * step,
    isFiniteNumber(opts.max) ? opts.max : Math.ceil(max / step) * step,
  ];
}

export function scaleLinear(config = {}) {
  const domain = config.domain || [0, 1];
  const range = config.range || [0, 1];
  let d0 = Number(domain[0]);
  let d1 = Number(domain[1]);
  const r0 = Number(range[0]);
  const r1 = Number(range[1]);

  if (!Number.isFinite(d0)) d0 = 0;
  if (!Number.isFinite(d1)) d1 = 1;
  if (d0 === d1) {
    d0 -= 0.5;
    d1 += 0.5;
  }

  const scale = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return r0 + ((n - d0) / (d1 - d0)) * (r1 - r0);
  };
  scale.domain = () => [d0, d1];
  scale.range = () => [r0, r1];
  scale.ticks = (count = 5) => ticks(d0, d1, count);
  return scale;
}

export function scaleTime(config = {}) {
  const domain = (config.domain || [new Date(0), new Date(1)]).map(toTime);
  const linear = scaleLinear({
    domain: [domain[0] ?? 0, domain[1] ?? 1],
    range: config.range || [0, 1],
  });
  const scale = (value) => linear(toTime(value));
  scale.domain = () => linear.domain().map((value) => new Date(value));
  scale.range = linear.range;
  scale.ticks = (count = 5) => linear.ticks(count).map((value) => new Date(value));
  return scale;
}

export function scaleBand(config = {}) {
  const domain = unique(config.domain || []).map(String);
  const range = config.range || [0, 1];
  const paddingInner = Number(config.paddingInner ?? config.padding ?? 0.16);
  const paddingOuter = Number(config.paddingOuter ?? config.padding ?? 0.16);
  const r0 = Number(range[0]);
  const r1 = Number(range[1]);
  const span = r1 - r0;
  const denominator = Math.max(1, domain.length - paddingInner + paddingOuter * 2);
  const step = span / denominator;
  const bandwidth = Math.abs(step * Math.max(0, 1 - paddingInner));

  const scale = (value) => {
    const index = domain.indexOf(String(value));
    if (index < 0) return null;
    return r0 + (paddingOuter + index) * step;
  };
  scale.domain = () => domain.slice();
  scale.range = () => [r0, r1];
  scale.bandwidth = () => bandwidth;
  scale.step = () => Math.abs(step);
  return scale;
}

export function scalePoint(config = {}) {
  const domain = unique(config.domain || []).map(String);
  const range = config.range || [0, 1];
  const padding = Number(config.padding ?? 0.5);
  const r0 = Number(range[0]);
  const r1 = Number(range[1]);
  const span = r1 - r0;
  const step = domain.length <= 1 ? 0 : span / Math.max(1, domain.length - 1 + padding * 2);
  const start = domain.length <= 1 ? r0 + span / 2 : r0 + padding * step;

  const scale = (value) => {
    const index = domain.indexOf(String(value));
    if (index < 0) return null;
    return start + index * step;
  };
  scale.domain = () => domain.slice();
  scale.range = () => [r0, r1];
  scale.step = () => Math.abs(step);
  scale.bandwidth = () => 0;
  return scale;
}

export function scaleOrdinal(config = {}) {
  const domain = unique(config.domain || []).map(String);
  const range = config.range || DEFAULT_COLORS;
  const scale = (value) => {
    const key = String(value);
    let index = domain.indexOf(key);
    if (index < 0) {
      domain.push(key);
      index = domain.length - 1;
    }
    return range[index % range.length];
  };
  scale.domain = () => domain.slice();
  scale.range = () => range.slice();
  return scale;
}

export function linePath(points) {
  const clean = points.filter((point) => isFiniteNumber(point.x) && isFiniteNumber(point.y));
  if (!clean.length) return '';
  return clean.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
}

export function areaPath(points, baselineY) {
  const clean = points.filter((point) => isFiniteNumber(point.x) && isFiniteNumber(point.y));
  if (!clean.length || !isFiniteNumber(baselineY)) return '';
  const line = linePath(clean);
  const last = clean[clean.length - 1];
  const first = clean[0];
  return `${line} L${last.x},${baselineY} L${first.x},${baselineY} Z`;
}

function polarPoint(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export function arcPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  if (!isFiniteNumber(outerRadius) || outerRadius <= 0 || endAngle <= startAngle) return '';

  const safeEnd = endAngle - startAngle >= TAU ? startAngle + TAU - ARC_EPSILON : endAngle;
  const largeArc = safeEnd - startAngle > Math.PI ? 1 : 0;
  const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, safeEnd);
  const inner = Math.max(0, Number(innerRadius) || 0);

  if (inner <= 0) {
    return [
      `M${cx},${cy}`,
      `L${outerStart.x},${outerStart.y}`,
      `A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
      'Z',
    ].join(' ');
  }

  const innerEnd = polarPoint(cx, cy, inner, safeEnd);
  const innerStart = polarPoint(cx, cy, inner, startAngle);
  return [
    `M${outerStart.x},${outerStart.y}`,
    `A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}`,
    `L${innerEnd.x},${innerEnd.y}`,
    `A${inner},${inner} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}`,
    'Z',
  ].join(' ');
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  return Math.abs(value) >= 1000 ? value.toLocaleString() : String(Number(value.toFixed(3)));
}

function formatTick(value, formatter) {
  if (typeof formatter === 'function') return formatter(value);
  if (value instanceof Date) {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(value);
  }
  return formatNumber(Number(value));
}

function formatCategory(value) {
  return value == null ? '' : String(value);
}

function attachTooltip(instance, mark, options, context, fallback) {
  const tooltip = options.tooltip;
  if (tooltip === false) return;

  const getContent = () => {
    if (typeof tooltip === 'function') {
      // Backward-compatible: the raw datum is the first arg (as before); the
      // typed context (x/y/value/label/index/seriesIndex/seriesName) is second.
      const result = tooltip(context.datum, context);
      return result === false ? null : result;
    }
    if (typeof tooltip === 'string') return tooltip;
    return fallback;
  };

  const show = (event) => {
    const content = getContent();
    if (content == null || content === '') return;
    instance.showTooltip(content, event);
  };
  const hide = () => instance.hideTooltip();
  mark.addEventListener('pointerenter', show);
  mark.addEventListener('pointermove', show);
  mark.addEventListener('pointerleave', hide);
  mark.addEventListener('focus', show);
  mark.addEventListener('blur', hide);
}

function attachClick(mark, callback, datum, index) {
  if (typeof callback !== 'function') return;
  const fire = (event) => callback({ event, datum, index });
  mark.addEventListener('click', fire);
  mark.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fire(event);
    }
  });
}

function makeInteractive(mark, hasClick, hasTooltip) {
  if (hasClick || hasTooltip) {
    mark.setAttribute('tabindex', '0');
    mark.setAttribute('focusable', 'true');
  }
}

function setupKeyboardNavigation(svg, markGroup) {
  svg.addEventListener('keydown', (event) => {
    const active = document.activeElement;
    if (!active || !markGroup.contains(active)) return;

    const marks = Array.from(markGroup.querySelectorAll('[tabindex="0"]'));
    if (!marks.length) return;
    const currentIndex = marks.indexOf(active);
    if (currentIndex === -1) return;

    let targetIndex = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      targetIndex = (currentIndex + 1) % marks.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      targetIndex = (currentIndex - 1 + marks.length) % marks.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      targetIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      targetIndex = marks.length - 1;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      active.blur();
    }

    if (targetIndex !== -1 && marks[targetIndex]) {
      marks[targetIndex].focus();
    }
  });
}

function renderDataTable(instance, tableData) {
  const { target, options } = instance;
  if (options.dataTable === false) return;
  if (!tableData || !tableData.rows || !tableData.rows.length) return;

  const table = document.createElement('table');
  table.className = 'vd-chart-data-table';
  if (options.dataTable !== 'visible') {
    table.classList.add('vd-chart-sr-only');
  }

  const caption = document.createElement('caption');
  caption.textContent =
    tableData.caption || options.title || options.ariaLabel || `${instance.kind} chart data`;
  table.appendChild(caption);

  if (tableData.headers && tableData.headers.length) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    tableData.headers.forEach((h) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.textContent = String(h);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  }

  const tbody = document.createElement('tbody');
  tableData.rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell, idx) => {
      const el = idx === 0 ? document.createElement('th') : document.createElement('td');
      if (idx === 0) el.setAttribute('scope', 'row');
      el.textContent = cell == null ? '' : String(cell);
      tr.appendChild(el);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  target.appendChild(table);
}

function createSvgShell(instance) {
  const { target, options } = instance;
  const size = measureTarget(target, options);
  const theme = resolveTheme(target, options.theme);
  const margin = normalizeMargin(options.margin, options.polar ? POLAR_MARGIN : DEFAULT_MARGIN);
  const plot = getPlotBox(size.width, size.height, margin);

  target.innerHTML = '';
  target.classList.add('vd-chart-root', `vd-chart-${instance.kind}`);
  if (getComputedStyle(target).position === 'static') {
    target.style.position = 'relative';
  }

  const svg = svgEl('svg', {
    class: 'vd-chart-svg',
    width: size.width,
    height: size.height,
    viewBox: `0 0 ${size.width} ${size.height}`,
    role: options.role || 'graphics-document document',
    'aria-roledescription': options.ariaRoleDescription || `${instance.kind} chart`,
  });

  const titleId = nextId('vd-chart-title');
  const descId = nextId('vd-chart-desc');
  const labelledBy = [];

  if (options.title) {
    labelledBy.push(titleId);
    append(svg, setText(svgEl('title', { id: titleId }), options.title));
  }
  if (options.description) {
    labelledBy.push(descId);
    append(svg, setText(svgEl('desc', { id: descId }), options.description));
  }
  if (labelledBy.length) {
    svg.setAttribute('aria-labelledby', labelledBy.join(' '));
  } else {
    svg.setAttribute('aria-label', options.ariaLabel || `${instance.kind} chart`);
  }

  if (options.title) {
    append(
      svg,
      setText(
        svgEl('text', {
          x: margin.left,
          y: 18,
          fill: theme.textColor,
          'font-size': 14,
          'font-weight': 600,
        }),
        options.title,
      ),
    );
  }

  target.appendChild(svg);
  instance.theme = theme;
  instance.size = size;
  instance.plot = plot;
  instance.tooltipEl = null;
  return { svg, size, theme, plot, margin };
}

function renderEmpty(svg, size, theme, message = 'No data') {
  append(
    svg,
    setText(
      svgEl('text', {
        class: 'vd-chart-empty',
        x: size.width / 2,
        y: size.height / 2,
        fill: theme.mutedTextColor,
        'text-anchor': 'middle',
      }),
      message,
    ),
  );
}

function drawAxisLine(svg, x1, y1, x2, y2, theme) {
  append(
    svg,
    svgEl('line', {
      x1,
      y1,
      x2,
      y2,
      stroke: theme.axisColor,
      'stroke-width': 1,
      'shape-rendering': 'crispEdges',
    }),
  );
}

function drawCartesianAxes(svg, config) {
  const { plot, xScale, yScale, xTicks, yTicks, theme, options, categoricalX } = config;
  const axisGroup = append(svg, svgEl('g', { class: 'vd-chart-axes', 'aria-hidden': 'true' }));

  yTicks.forEach((tick) => {
    const y = yScale(tick);
    if (!isFiniteNumber(y)) return;
    append(
      axisGroup,
      svgEl('line', {
        x1: plot.left,
        y1: y,
        x2: plot.right,
        y2: y,
        stroke: theme.gridColor,
        'stroke-width': 1,
        'shape-rendering': 'crispEdges',
      }),
    );
    append(
      axisGroup,
      setText(
        svgEl('text', {
          x: plot.left - 10,
          y: y + 4,
          fill: theme.mutedTextColor,
          'font-size': 11,
          'text-anchor': 'end',
        }),
        formatTick(tick, options.yFormat),
      ),
    );
  });

  drawAxisLine(axisGroup, plot.left, plot.bottom, plot.right, plot.bottom, theme);
  drawAxisLine(axisGroup, plot.left, plot.top, plot.left, plot.bottom, theme);

  xTicks.forEach((tick) => {
    let x = xScale(tick);
    if (categoricalX && typeof xScale.bandwidth === 'function') {
      x += xScale.bandwidth() / 2;
    }
    if (!isFiniteNumber(x)) return;
    append(
      axisGroup,
      svgEl('line', {
        x1: x,
        y1: plot.bottom,
        x2: x,
        y2: plot.bottom + 5,
        stroke: theme.axisColor,
        'stroke-width': 1,
      }),
    );
    append(
      axisGroup,
      setText(
        svgEl('text', {
          x,
          y: plot.bottom + 20,
          fill: theme.mutedTextColor,
          'font-size': 11,
          'text-anchor': 'middle',
        }),
        categoricalX ? formatCategory(tick) : formatTick(tick, options.xFormat),
      ),
    );
  });

  if (options.xAxis?.label) {
    append(
      axisGroup,
      setText(
        svgEl('text', {
          x: (plot.left + plot.right) / 2,
          y: plot.bottom + 40,
          fill: theme.mutedTextColor,
          'font-size': 12,
          'text-anchor': 'middle',
        }),
        options.xAxis.label,
      ),
    );
  }

  if (options.yAxis?.label) {
    append(
      axisGroup,
      setText(
        svgEl('text', {
          x: -((plot.top + plot.bottom) / 2),
          y: 15,
          fill: theme.mutedTextColor,
          'font-size': 12,
          'text-anchor': 'middle',
          transform: 'rotate(-90)',
        }),
        options.yAxis.label,
      ),
    );
  }
}

function inferXScale(rows, plot, options) {
  const values = rows.map((row) => row.x);
  const explicitType = options.xScale;
  const allNumeric = values.every((value) => toNumber(value) !== null);
  const allDates = values.every(isDateLike);

  if (explicitType === 'time' || (!explicitType && allDates)) {
    const times = values.map(toTime).filter(isFiniteNumber);
    return {
      scale: scaleTime({ domain: niceDomain(times), range: [plot.left, plot.right] }),
      values: times,
      ticks: scaleLinear({ domain: niceDomain(times), range: [plot.left, plot.right] })
        .ticks(5)
        .map((value) => new Date(value)),
      type: 'time',
      mapValue: toTime,
    };
  }

  if (explicitType === 'linear' || (!explicitType && allNumeric)) {
    const nums = values.map(toNumber).filter(isFiniteNumber);
    const domain = niceDomain(nums, { min: options.xMin, max: options.xMax });
    const scale = scaleLinear({ domain, range: [plot.left, plot.right] });
    return {
      scale,
      values: nums,
      ticks: scale.ticks(5),
      type: 'linear',
      mapValue: toNumber,
    };
  }

  const domain = unique(values).map(String);
  return {
    scale: scalePoint({ domain, range: [plot.left, plot.right], padding: 0.5 }),
    values: domain,
    ticks: domain,
    type: 'point',
    mapValue: (value) => String(value),
  };
}

function getColorScale(rows, colorOption, theme) {
  if (colorOption == null) return null;
  // A function returns a CSS color per datum directly (e.g. (row) => '#40c057').
  if (typeof colorOption === 'function') {
    return { direct: colorOption };
  }
  // A string names a category field → ordinal palette (legacy behavior).
  const colorAccessor = createAccessor(colorOption);
  const domain = unique(rows.map((row) => colorAccessor(row.raw))).map(String);
  return {
    accessor: colorAccessor,
    scale: scaleOrdinal({ domain, range: theme.colors }),
  };
}

function colorForRow(color, row, theme) {
  if (color) {
    if (typeof color.direct === 'function') return color.direct(row.raw);
    if (color.scale) return color.scale(color.accessor(row.raw));
  }
  return theme.colors[row.index % theme.colors.length];
}

/**
 * Normalize `options.series` (or the implicit single series) into a list of
 * `{ name, color, seriesIndex, rows }`. Series may share `options.data` with
 * their own `y` accessor, or carry their own `data`.
 */
function buildSeriesList(options) {
  const xAccessor = createAccessor(options.x, 'x');
  const sharedData = toArray(options.data);
  const buildRows = (data, yAccessor) =>
    data
      .map((datum, index) => ({
        raw: datum,
        index,
        x: xAccessor(datum),
        y: toNumber(yAccessor(datum)),
      }))
      .filter((row) => row.x != null && isFiniteNumber(row.y));

  if (Array.isArray(options.series) && options.series.length) {
    return options.series.map((series, seriesIndex) => {
      const data = Array.isArray(series.data) && series.data.length ? series.data : sharedData;
      const yAccessor = createAccessor(series.y ?? options.y, 'y');
      return {
        name: series.name ?? `Series ${seriesIndex + 1}`,
        color: series.color,
        seriesIndex,
        rows: buildRows(data, yAccessor),
      };
    });
  }

  return [
    {
      name: options.name ?? null,
      color: options.stroke,
      seriesIndex: 0,
      rows: buildRows(sharedData, createAccessor(options.y, 'y')),
    },
  ];
}

function seriesColor(series, theme) {
  return series.color || theme.colors[series.seriesIndex % theme.colors.length];
}

/**
 * Horizontal legend along the top-right of the plot. Items: `{ label, color }`.
 * Widths are estimated (no DOM text measurement available), which is fine for
 * the short series/category labels legends carry.
 */
function renderTopLegend(svg, items, theme, plot) {
  if (!items.length) return;
  const shown = items.slice(0, 8);
  const widths = shown.map((item) => 14 + String(item.label).length * 6.5 + 14);
  const total = widths.reduce((sum, w) => sum + w, 0);
  let x = Math.max(plot.left, plot.right - total);
  const y = 14;
  const legend = append(svg, svgEl('g', { class: 'vd-chart-legend' }));
  shown.forEach((item, index) => {
    append(
      legend,
      svgEl('rect', {
        x,
        y: y - 8,
        width: 10,
        height: 10,
        rx: 2,
        fill: item.color,
      }),
    );
    append(
      legend,
      setText(
        svgEl('text', {
          x: x + 14,
          y,
          fill: theme.mutedTextColor,
          'font-size': 11,
        }),
        formatCategory(item.label),
      ),
    );
    x += widths[index];
  });
}

function dataLabelConfig(options) {
  const dl = options.dataLabels;
  if (!dl) return null;
  return typeof dl === 'object' ? dl : {};
}

function drawDataLabel(svg, x, y, value, cfg, theme, anchor = 'middle') {
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return;
  append(
    svg,
    setText(
      svgEl('text', {
        class: 'vd-chart-data-label',
        x,
        y,
        fill: cfg.color || theme.textColor,
        'font-size': 10,
        'text-anchor': anchor,
      }),
      typeof cfg.format === 'function' ? cfg.format(value) : formatNumber(value),
    ),
  );
}

/**
 * Reference lines. `annotations: Array<{ y?, x?, label?, color?, dash? }>` —
 * `y` draws a horizontal line, `x` (numeric/category) a vertical one.
 */
function drawAnnotations(svg, options, plot, xScale, yScale, theme) {
  const annotations = toArray(options.annotations);
  if (!annotations.length) return;
  const group = append(
    svg,
    svgEl('g', {
      class: 'vd-chart-annotations',
      role: 'graphics-object',
      'aria-roledescription': 'annotations',
    }),
  );
  annotations.forEach((ann) => {
    const color = ann.color || theme.mutedTextColor;
    const dash = ann.dash === false ? null : '4 3';
    if (isFiniteNumber(ann.y) && yScale) {
      const y = yScale(ann.y);
      if (!isFiniteNumber(y)) return;
      append(
        group,
        svgEl('line', {
          class: 'vd-chart-annotation-line',
          x1: plot.left,
          y1: y,
          x2: plot.right,
          y2: y,
          stroke: color,
          'stroke-width': 1,
          'stroke-dasharray': dash,
        }),
      );
      if (ann.label) {
        append(
          group,
          setText(
            svgEl('text', {
              x: plot.right - 4,
              y: y - 4,
              fill: color,
              'font-size': 10,
              'text-anchor': 'end',
            }),
            ann.label,
          ),
        );
      }
    }
    if (ann.x != null && xScale) {
      let x = xScale(ann.x);
      if (typeof xScale.bandwidth === 'function' && isFiniteNumber(x)) {
        x += xScale.bandwidth() / 2;
      }
      if (!isFiniteNumber(x)) return;
      append(
        group,
        svgEl('line', {
          class: 'vd-chart-annotation-line',
          x1: x,
          y1: plot.top,
          x2: x,
          y2: plot.bottom,
          stroke: color,
          'stroke-width': 1,
          'stroke-dasharray': dash,
        }),
      );
      if (ann.label) {
        append(
          group,
          setText(
            svgEl('text', {
              x: x + 4,
              y: plot.top + 10,
              fill: color,
              'font-size': 10,
            }),
            ann.label,
          ),
        );
      }
    }
  });
}

function renderBarChart(instance) {
  if (instance.options.series?.length) return renderMultiBarChart(instance);

  const shell = createSvgShell(instance);
  const { svg, size, theme, plot } = shell;
  const options = instance.options;
  const data = toArray(options.data);
  const xAccessor = createAccessor(options.x, 'x');
  const yAccessor = createAccessor(options.y, 'y');
  const rows = data
    .map((datum, index) => ({
      raw: datum,
      index,
      x: xAccessor(datum),
      y: toNumber(yAccessor(datum)),
    }))
    .filter((row) => row.x != null && isFiniteNumber(row.y));

  if (!rows.length) {
    renderEmpty(svg, size, theme);
    return;
  }

  const categories = unique(rows.map((row) => row.x)).map(String);
  const xScale = scaleBand({
    domain: categories,
    range: [plot.left, plot.right],
    padding: options.barPadding ?? 0.18,
  });
  const yDomain = niceDomain(
    rows.map((row) => row.y),
    {
      includeZero: true,
      min: options.yMin,
      max: options.yMax,
      tickCount: options.yTickCount,
    },
  );
  const yScale = scaleLinear({ domain: yDomain, range: [plot.bottom, plot.top] });
  const yTicks = yScale.ticks(options.yTickCount ?? 5);
  const color = getColorScale(rows, options.color, theme);

  drawCartesianAxes(svg, {
    plot,
    xScale,
    yScale,
    xTicks: categories,
    yTicks,
    theme,
    options,
    categoricalX: true,
  });

  drawAnnotations(svg, options, plot, xScale, yScale, theme);
  const labels = dataLabelConfig(options);
  const markGroup = append(
    svg,
    svgEl('g', {
      class: 'vd-chart-marks vd-chart-bars',
      role: 'graphics-object',
      'aria-roledescription': 'data points',
    }),
  );
  // Clamp the bar baseline into the rendered domain so an explicit yMin > 0
  // (or yMax < 0) anchors bars to the axis floor instead of extrapolating past
  // it — mirrors the area/line renderers' yScale(Math.max(0, yDomain[0])) clamp.
  const baseline = yScale(Math.min(Math.max(0, yDomain[0]), yDomain[1]));
  rows.forEach((row) => {
    const x = xScale(row.x);
    const y = yScale(row.y);
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(baseline)) return;
    const rectY = Math.min(y, baseline);
    const rectHeight = Math.max(1, Math.abs(baseline - y));
    const fill = colorForRow(color, row, theme);
    const rect = svgEl('rect', {
      class: 'vd-chart-bar',
      x,
      y: rectY,
      width: xScale.bandwidth(),
      height: rectHeight,
      rx: 3,
      fill,
      role: 'graphics-symbol',
      'aria-roledescription': 'bar',
      'aria-label': `${formatCategory(row.x)}: ${formatNumber(row.y)}`,
    });
    makeInteractive(rect, typeof options.onBarClick === 'function', options.tooltip !== false);
    attachTooltip(
      instance,
      rect,
      options,
      {
        datum: row.raw,
        x: row.x,
        y: row.y,
        value: row.y,
        label: row.x,
        index: row.index,
      },
      `${formatCategory(row.x)}: ${formatNumber(row.y)}`,
    );
    attachClick(rect, options.onBarClick, row.raw, row.index);
    if (labels) drawDataLabel(svg, x + xScale.bandwidth() / 2, rectY - 4, row.y, labels, theme);
    append(markGroup, rect);
  });

  setupKeyboardNavigation(svg, markGroup);
  renderDataTable(instance, {
    caption: options.title || options.ariaLabel || `${instance.kind} chart data`,
    headers: [options.xAxis?.label || 'Category', options.yAxis?.label || 'Value'],
    rows: rows.map((r) => [formatCategory(r.x), formatNumber(r.y)]),
  });

  if (options.legend && color && color.scale) {
    renderTopLegend(
      svg,
      color.scale.domain().map((cat) => ({ label: cat, color: color.scale(cat) })),
      theme,
      plot,
    );
  }
}

function renderMultiBarChart(instance) {
  const shell = createSvgShell(instance);
  const { svg, size, theme, plot } = shell;
  const options = instance.options;
  const seriesList = buildSeriesList(options);
  const allRows = seriesList.flatMap((series) => series.rows);

  if (!allRows.length) {
    renderEmpty(svg, size, theme);
    return;
  }

  const categories = unique(allRows.map((row) => String(row.x)));
  const xScale = scaleBand({
    domain: categories,
    range: [plot.left, plot.right],
    padding: options.barPadding ?? 0.18,
  });
  const innerScale = scaleBand({
    domain: seriesList.map((series) => series.name),
    range: [0, xScale.bandwidth()],
    padding: 0.08,
  });
  const yDomain = niceDomain(
    allRows.map((row) => row.y),
    {
      includeZero: true,
      min: options.yMin,
      max: options.yMax,
      tickCount: options.yTickCount,
    },
  );
  const yScale = scaleLinear({ domain: yDomain, range: [plot.bottom, plot.top] });
  const yTicks = yScale.ticks(options.yTickCount ?? 5);

  drawCartesianAxes(svg, {
    plot,
    xScale,
    yScale,
    xTicks: categories,
    yTicks,
    theme,
    options,
    categoricalX: true,
  });

  drawAnnotations(svg, options, plot, xScale, yScale, theme);
  const labels = dataLabelConfig(options);
  const markGroup = append(
    svg,
    svgEl('g', {
      class: 'vd-chart-marks vd-chart-bars',
      role: 'graphics-object',
      'aria-roledescription': 'grouped bars',
    }),
  );
  // Clamp the bar baseline into the rendered domain (see renderBarChart) so a
  // grouped bar chart with an explicit yMin > 0 stays anchored to the axis floor.
  const baseline = yScale(Math.min(Math.max(0, yDomain[0]), yDomain[1]));
  seriesList.forEach((series) => {
    const fill = seriesColor(series, theme);
    series.rows.forEach((row) => {
      const groupX = xScale(String(row.x));
      const offset = innerScale(series.name);
      const y = yScale(row.y);
      if (![groupX, offset, y, baseline].every(isFiniteNumber)) return;
      const rectY = Math.min(y, baseline);
      const rectHeight = Math.max(1, Math.abs(baseline - y));
      const rect = svgEl('rect', {
        class: 'vd-chart-bar',
        x: groupX + offset,
        y: rectY,
        width: innerScale.bandwidth(),
        height: rectHeight,
        rx: 3,
        fill,
        role: 'graphics-symbol',
        'aria-roledescription': 'bar',
        'aria-label': `${series.name} — ${formatCategory(row.x)}: ${formatNumber(row.y)}`,
      });
      makeInteractive(rect, typeof options.onBarClick === 'function', options.tooltip !== false);
      attachTooltip(
        instance,
        rect,
        options,
        {
          datum: row.raw,
          x: row.x,
          y: row.y,
          value: row.y,
          label: row.x,
          index: row.index,
          seriesIndex: series.seriesIndex,
          seriesName: series.name,
        },
        `${series.name} — ${formatCategory(row.x)}: ${formatNumber(row.y)}`,
      );
      attachClick(rect, options.onBarClick, row.raw, row.index);
      if (labels)
        drawDataLabel(
          svg,
          groupX + offset + innerScale.bandwidth() / 2,
          rectY - 4,
          row.y,
          labels,
          theme,
        );
      append(markGroup, rect);
    });
  });

  setupKeyboardNavigation(svg, markGroup);
  const tableRows = categories.map((cat) => {
    const rowCells = [cat];
    seriesList.forEach((s) => {
      const match = s.rows.find((r) => String(r.x) === cat);
      rowCells.push(match && isFiniteNumber(match.y) ? formatNumber(match.y) : '');
    });
    return rowCells;
  });
  renderDataTable(instance, {
    caption: options.title || options.ariaLabel || `${instance.kind} chart data`,
    headers: [options.xAxis?.label || 'Category', ...seriesList.map((s) => s.name)],
    rows: tableRows,
  });

  if (options.legend !== false) {
    renderTopLegend(
      svg,
      seriesList.map((series) => ({ label: series.name, color: seriesColor(series, theme) })),
      theme,
      plot,
    );
  }
}

function renderLineLikeChart(instance, mode) {
  if (instance.options.series?.length) return renderMultiLineChart(instance, mode);

  const shell = createSvgShell(instance);
  const { svg, size, theme, plot } = shell;
  const options = instance.options;
  const data = toArray(options.data);
  const xAccessor = createAccessor(options.x, 'x');
  const yAccessor = createAccessor(options.y, 'y');
  const rows = data
    .map((datum, index) => ({
      raw: datum,
      index,
      x: xAccessor(datum),
      y: toNumber(yAccessor(datum)),
    }))
    .filter((row) => row.x != null && isFiniteNumber(row.y));

  if (!rows.length) {
    renderEmpty(svg, size, theme);
    return;
  }

  const xInfo = inferXScale(rows, plot, options);
  const yDomain = niceDomain(
    rows.map((row) => row.y),
    {
      includeZero: mode === 'area' || options.yIncludeZero === true,
      min: options.yMin,
      max: options.yMax,
      tickCount: options.yTickCount,
    },
  );
  const yScale = scaleLinear({ domain: yDomain, range: [plot.bottom, plot.top] });
  const yTicks = yScale.ticks(options.yTickCount ?? 5);
  const color = options.stroke || theme.colors[0];
  const points = rows
    .map((row) => ({
      raw: row.raw,
      index: row.index,
      xValue: row.x,
      yValue: row.y,
      x: xInfo.scale(xInfo.mapValue(row.x)),
      y: yScale(row.y),
    }))
    .filter((point) => isFiniteNumber(point.x) && isFiniteNumber(point.y));

  drawCartesianAxes(svg, {
    plot,
    xScale: xInfo.scale,
    yScale,
    xTicks: xInfo.ticks,
    yTicks,
    theme,
    options,
    categoricalX: xInfo.type === 'point',
  });

  drawAnnotations(svg, options, plot, xInfo.scale, yScale, theme);
  const labels = dataLabelConfig(options);
  const markGroup = append(
    svg,
    svgEl('g', {
      class: `vd-chart-marks vd-chart-${mode}`,
      role: 'graphics-object',
      'aria-roledescription': `${mode} series`,
    }),
  );

  if (mode === 'area') {
    const baseline = yScale(Math.max(0, yDomain[0]));
    append(
      markGroup,
      svgEl('path', {
        class: 'vd-chart-area-path',
        d: areaPath(points, baseline),
        fill: options.fill || color,
        opacity: options.fillOpacity ?? 0.18,
        stroke: 'none',
      }),
    );
  }

  append(
    markGroup,
    svgEl('path', {
      class: 'vd-chart-line-path',
      d: linePath(points),
      fill: 'none',
      stroke: color,
      'stroke-width': options.strokeWidth || 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );

  if (options.points !== false) {
    points.forEach((point) => {
      const circle = svgEl('circle', {
        class: 'vd-chart-point',
        cx: point.x,
        cy: point.y,
        r: options.pointRadius || 3.5,
        fill: options.pointFill || theme.backgroundColor,
        stroke: color,
        'stroke-width': 2,
        role: 'graphics-symbol',
        'aria-roledescription': 'data point',
        'aria-label': `${formatCategory(point.xValue)}: ${formatNumber(point.yValue)}`,
      });
      makeInteractive(
        circle,
        typeof options.onPointClick === 'function',
        options.tooltip !== false,
      );
      attachTooltip(
        instance,
        circle,
        options,
        {
          datum: point.raw,
          x: point.xValue,
          y: point.yValue,
          value: point.yValue,
          index: point.index,
        },
        `${formatCategory(point.xValue)}: ${formatNumber(point.yValue)}`,
      );
      attachClick(circle, options.onPointClick, point.raw, point.index);
      append(markGroup, circle);
    });
  }

  if (labels) {
    points.forEach((point) =>
      drawDataLabel(svg, point.x, point.y - 8, point.yValue, labels, theme),
    );
  }

  setupKeyboardNavigation(svg, markGroup);
  renderDataTable(instance, {
    caption: options.title || options.ariaLabel || `${instance.kind} chart data`,
    headers: [options.xAxis?.label || 'X', options.yAxis?.label || 'Y'],
    rows: points.map((p) => [formatCategory(p.xValue), formatNumber(p.yValue)]),
  });
}

function renderMultiLineChart(instance, mode) {
  const shell = createSvgShell(instance);
  const { svg, size, theme, plot } = shell;
  const options = instance.options;
  const seriesList = buildSeriesList(options);
  const allRows = seriesList.flatMap((series) => series.rows);

  if (!allRows.length) {
    renderEmpty(svg, size, theme);
    return;
  }

  const xInfo = inferXScale(allRows, plot, options);
  const yDomain = niceDomain(
    allRows.map((row) => row.y),
    {
      includeZero: mode === 'area' || options.yIncludeZero === true,
      min: options.yMin,
      max: options.yMax,
      tickCount: options.yTickCount,
    },
  );
  const yScale = scaleLinear({ domain: yDomain, range: [plot.bottom, plot.top] });
  const yTicks = yScale.ticks(options.yTickCount ?? 5);

  drawCartesianAxes(svg, {
    plot,
    xScale: xInfo.scale,
    yScale,
    xTicks: xInfo.ticks,
    yTicks,
    theme,
    options,
    categoricalX: xInfo.type === 'point',
  });

  drawAnnotations(svg, options, plot, xInfo.scale, yScale, theme);
  const labels = dataLabelConfig(options);
  const markGroup = append(
    svg,
    svgEl('g', {
      class: `vd-chart-marks vd-chart-${mode}`,
      role: 'graphics-object',
      'aria-roledescription': `multi-series ${mode}`,
    }),
  );
  const baseline = yScale(Math.max(0, yDomain[0]));

  seriesList.forEach((series) => {
    const stroke = seriesColor(series, theme);
    const points = series.rows
      .map((row) => ({
        raw: row.raw,
        index: row.index,
        xValue: row.x,
        yValue: row.y,
        x: xInfo.scale(xInfo.mapValue(row.x)),
        y: yScale(row.y),
      }))
      .filter((point) => isFiniteNumber(point.x) && isFiniteNumber(point.y));

    if (mode === 'area') {
      append(
        markGroup,
        svgEl('path', {
          class: 'vd-chart-area-path',
          d: areaPath(points, baseline),
          fill: series.color || stroke,
          opacity: options.fillOpacity ?? 0.18,
          stroke: 'none',
        }),
      );
    }

    append(
      markGroup,
      svgEl('path', {
        class: 'vd-chart-line-path',
        d: linePath(points),
        fill: 'none',
        stroke,
        'stroke-width': options.strokeWidth || 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );

    if (options.points !== false) {
      points.forEach((point) => {
        const circle = svgEl('circle', {
          class: 'vd-chart-point',
          cx: point.x,
          cy: point.y,
          r: options.pointRadius || 3.5,
          fill: options.pointFill || theme.backgroundColor,
          stroke,
          'stroke-width': 2,
          role: 'graphics-symbol',
          'aria-roledescription': 'data point',
          'aria-label': `${series.name} ${formatCategory(point.xValue)}: ${formatNumber(point.yValue)}`,
        });
        makeInteractive(
          circle,
          typeof options.onPointClick === 'function',
          options.tooltip !== false,
        );
        attachTooltip(
          instance,
          circle,
          options,
          {
            datum: point.raw,
            x: point.xValue,
            y: point.yValue,
            value: point.yValue,
            index: point.index,
            seriesIndex: series.seriesIndex,
            seriesName: series.name,
          },
          `${series.name} — ${formatCategory(point.xValue)}: ${formatNumber(point.yValue)}`,
        );
        attachClick(circle, options.onPointClick, point.raw, point.index);
        append(markGroup, circle);
      });
    }

    if (labels) {
      points.forEach((point) =>
        drawDataLabel(svg, point.x, point.y - 8, point.yValue, labels, theme),
      );
    }
  });

  setupKeyboardNavigation(svg, markGroup);
  // Match table cells by the same normalized x used for the scale, so
  // per-series Date/object x values compare by value rather than reference.
  const xKey = (value) => String(xInfo.mapValue(value));
  const uniqueX = new Map();
  for (const row of allRows) {
    const key = xKey(row.x);
    if (!uniqueX.has(key)) uniqueX.set(key, row.x);
  }
  const seriesValues = seriesList.map((s) => {
    const byX = new Map();
    for (const row of s.rows) byX.set(xKey(row.x), row.y);
    return byX;
  });
  const tableRows = [...uniqueX.entries()].map(([key, xVal]) => {
    const rowCells = [formatCategory(xVal)];
    seriesValues.forEach((byX) => {
      const y = byX.get(key);
      rowCells.push(isFiniteNumber(y) ? formatNumber(y) : '');
    });
    return rowCells;
  });
  renderDataTable(instance, {
    caption: options.title || options.ariaLabel || `${instance.kind} chart data`,
    headers: [options.xAxis?.label || 'X', ...seriesList.map((s) => s.name)],
    rows: tableRows,
  });

  if (options.legend !== false) {
    renderTopLegend(
      svg,
      seriesList.map((series) => ({ label: series.name, color: seriesColor(series, theme) })),
      theme,
      plot,
    );
  }
}

function renderScatterChart(instance) {
  const shell = createSvgShell(instance);
  const { svg, size, theme, plot } = shell;
  const options = instance.options;
  const data = toArray(options.data);
  const xAccessor = createAccessor(options.x, 'x');
  const yAccessor = createAccessor(options.y, 'y');
  const rows = data
    .map((datum, index) => ({
      raw: datum,
      index,
      x: xAccessor(datum),
      y: toNumber(yAccessor(datum)),
    }))
    .filter((row) => row.x != null && isFiniteNumber(row.y));

  if (!rows.length) {
    renderEmpty(svg, size, theme);
    return;
  }

  const xInfo = inferXScale(rows, plot, options);
  const yDomain = niceDomain(
    rows.map((row) => row.y),
    {
      includeZero: options.yIncludeZero === true,
      min: options.yMin,
      max: options.yMax,
      tickCount: options.yTickCount,
    },
  );
  const yScale = scaleLinear({ domain: yDomain, range: [plot.bottom, plot.top] });
  const yTicks = yScale.ticks(options.yTickCount ?? 5);
  const color = getColorScale(rows, options.color, theme);

  drawCartesianAxes(svg, {
    plot,
    xScale: xInfo.scale,
    yScale,
    xTicks: xInfo.ticks,
    yTicks,
    theme,
    options,
    categoricalX: xInfo.type === 'point',
  });

  drawAnnotations(svg, options, plot, xInfo.scale, yScale, theme);
  const labels = dataLabelConfig(options);
  const markGroup = append(
    svg,
    svgEl('g', {
      class: 'vd-chart-marks vd-chart-scatter',
      role: 'graphics-object',
      'aria-roledescription': 'data points',
    }),
  );
  rows.forEach((row) => {
    const cx = xInfo.scale(xInfo.mapValue(row.x));
    const cy = yScale(row.y);
    if (!isFiniteNumber(cx) || !isFiniteNumber(cy)) return;
    const fill = colorForRow(color, row, theme);
    const circle = svgEl('circle', {
      class: 'vd-chart-scatter-point',
      cx,
      cy,
      r: options.pointRadius || 4,
      fill,
      opacity: options.pointOpacity ?? 0.88,
      role: 'graphics-symbol',
      'aria-roledescription': 'data point',
      'aria-label': `${formatCategory(row.x)}: ${formatNumber(row.y)}`,
    });
    makeInteractive(circle, typeof options.onPointClick === 'function', options.tooltip !== false);
    attachTooltip(
      instance,
      circle,
      options,
      {
        datum: row.raw,
        x: row.x,
        y: row.y,
        value: row.y,
        index: row.index,
      },
      `${formatCategory(row.x)}: ${formatNumber(row.y)}`,
    );
    attachClick(circle, options.onPointClick, row.raw, row.index);
    if (labels) drawDataLabel(svg, cx, cy - 8, row.y, labels, theme);
    append(markGroup, circle);
  });

  setupKeyboardNavigation(svg, markGroup);
  renderDataTable(instance, {
    caption: options.title || options.ariaLabel || `${instance.kind} chart data`,
    headers: [options.xAxis?.label || 'X', options.yAxis?.label || 'Y'],
    rows: rows.map((r) => [formatCategory(r.x), formatNumber(r.y)]),
  });

  if (options.legend && color && color.scale) {
    renderTopLegend(
      svg,
      color.scale.domain().map((cat) => ({ label: cat, color: color.scale(cat) })),
      theme,
      plot,
    );
  }
}

function renderLegend(svg, rows, colorScale, theme, x, y) {
  const legend = append(svg, svgEl('g', { class: 'vd-chart-legend' }));
  rows.slice(0, 8).forEach((row, index) => {
    const itemY = y + index * 20;
    append(
      legend,
      svgEl('rect', {
        x,
        y: itemY - 9,
        width: 10,
        height: 10,
        rx: 2,
        fill: colorScale(row.label),
      }),
    );
    append(
      legend,
      setText(
        svgEl('text', {
          x: x + 16,
          y: itemY,
          fill: theme.mutedTextColor,
          'font-size': 11,
        }),
        formatCategory(row.label),
      ),
    );
  });
}

function renderDonutChart(instance) {
  instance.options.polar = true;
  const shell = createSvgShell(instance);
  const { svg, size, theme, plot } = shell;
  const options = instance.options;
  const data = toArray(options.data);
  const labelAccessor = createAccessor(options.label, 'label');
  const valueAccessor = createAccessor(options.value, 'value');
  const rows = data
    .map((datum, index) => ({
      raw: datum,
      index,
      label: labelAccessor(datum),
      value: toNumber(valueAccessor(datum)),
    }))
    .filter((row) => row.label != null && isFiniteNumber(row.value) && row.value > 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (!rows.length || total <= 0) {
    renderEmpty(svg, size, theme);
    return;
  }

  const legendSpace = options.legend === false || size.width < 520 ? 0 : 128;
  const cx = (plot.left + plot.right - legendSpace) / 2;
  const cy = (plot.top + plot.bottom) / 2 + 5;
  const outerRadius = Math.max(
    28,
    Math.min(plot.right - plot.left - legendSpace, plot.bottom - plot.top) / 2,
  );
  const ratio = Math.max(0, Math.min(0.9, Number(options.innerRadiusRatio ?? 0.62)));
  const innerRadius = outerRadius * ratio;
  const colorScale = scaleOrdinal({ domain: rows.map((row) => row.label), range: theme.colors });
  const labels = dataLabelConfig(options);
  const markGroup = append(
    svg,
    svgEl('g', {
      class: 'vd-chart-marks vd-chart-slices',
      role: 'graphics-object',
      'aria-roledescription': 'pie slices',
    }),
  );
  let cursor = -Math.PI / 2;

  rows.forEach((row) => {
    const angle = (row.value / total) * TAU;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    const path = svgEl('path', {
      class: 'vd-chart-slice',
      d: arcPath(cx, cy, outerRadius, innerRadius, start, end),
      fill: colorScale(row.label),
      stroke: theme.backgroundColor,
      'stroke-width': 2,
      role: 'graphics-symbol',
      'aria-roledescription': 'slice',
      'aria-label': `${formatCategory(row.label)}: ${formatNumber(row.value)}`,
    });
    makeInteractive(path, typeof options.onSliceClick === 'function', options.tooltip !== false);
    attachTooltip(
      instance,
      path,
      options,
      {
        datum: row.raw,
        label: row.label,
        value: row.value,
        y: row.value,
        index: row.index,
      },
      `${formatCategory(row.label)}: ${formatNumber(row.value)}`,
    );
    attachClick(path, options.onSliceClick, row.raw, row.index);
    if (labels) {
      const mid = (start + end) / 2;
      const point = polarPoint(cx, cy, (innerRadius + outerRadius) / 2, mid);
      drawDataLabel(svg, point.x, point.y, row.value, labels, theme);
    }
    append(markGroup, path);
  });

  setupKeyboardNavigation(svg, markGroup);
  renderDataTable(instance, {
    caption: options.title || options.ariaLabel || `${instance.kind} chart data`,
    headers: ['Category', 'Value', 'Percentage'],
    rows: rows.map((r) => [
      formatCategory(r.label),
      formatNumber(r.value),
      total > 0 ? `${Math.round((r.value / total) * 100)}%` : '0%',
    ]),
  });

  if (innerRadius > 16 && options.centerLabel !== false) {
    append(
      svg,
      setText(
        svgEl('text', {
          x: cx,
          y: cy - 2,
          fill: theme.textColor,
          'font-size': 18,
          'font-weight': 700,
          'text-anchor': 'middle',
        }),
        options.centerLabel || formatNumber(total),
      ),
    );
    append(
      svg,
      setText(
        svgEl('text', {
          x: cx,
          y: cy + 16,
          fill: theme.mutedTextColor,
          'font-size': 11,
          'text-anchor': 'middle',
        }),
        options.centerSubLabel || 'total',
      ),
    );
  }

  if (legendSpace) {
    renderLegend(svg, rows, colorScale, theme, plot.right - legendSpace + 8, plot.top + 28);
  }
}

class ChartInstance {
  constructor(kind, options, renderer) {
    this.kind = kind;
    this.options = { ...options };
    this.target = resolveTarget(options.target);
    this.renderer = renderer;
    this.resizeObserver = null;
    this.destroyed = false;
    this.theme = null;
    this.size = null;
    this.plot = null;
    this.tooltipEl = null;
    this.render();
    this.setupResizeObserver();
  }

  render() {
    if (this.destroyed) return this;
    const tableHeight = dataTableContribution(this.target);
    this.renderer(this);
    // The first visible table does not exist when the shell is measured. If
    // its layout contribution changed, render once more so the SVG uses the
    // chart area rather than the full target height. This also covers runtime
    // dataTable mode/row-height changes without an unbounded render loop.
    if (!Number(this.options.height) && dataTableContribution(this.target) !== tableHeight) {
      this.renderer(this);
    }
    return this;
  }

  update(nextOptions = {}) {
    if (this.destroyed) return this;
    this.options = { ...this.options, ...nextOptions };
    return this.render();
  }

  resize() {
    return this.render();
  }

  setupResizeObserver() {
    if (this.options.responsive === false || !hasWindow() || typeof ResizeObserver === 'undefined')
      return;
    const chartHeight = () =>
      Math.max(0, this.target.clientHeight - dataTableContribution(this.target));
    let lastWidth = this.target.clientWidth;
    let lastHeight = chartHeight();
    this.resizeObserver = new ResizeObserver(() => {
      const width = this.target.clientWidth;
      const height = chartHeight();
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      this.resize();
    });
    this.resizeObserver.observe(this.target);
  }

  ensureTooltip() {
    if (this.tooltipEl && this.tooltipEl.isConnected) return this.tooltipEl;
    const tooltip = document.createElement('div');
    tooltip.className = 'vd-chart-tooltip';
    tooltip.setAttribute('role', 'status');
    tooltip.setAttribute('aria-live', 'polite');
    this.target.appendChild(tooltip);
    this.tooltipEl = tooltip;
    return tooltip;
  }

  showTooltip(content, event) {
    const tooltip = this.ensureTooltip();
    tooltip.textContent = String(content);
    const rect = this.target.getBoundingClientRect();
    let x = rect.width / 2;
    let y = rect.height / 2;
    if (event && isFiniteNumber(event.clientX) && isFiniteNumber(event.clientY)) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else if (event && event.target && typeof event.target.getBoundingClientRect === 'function') {
      const markRect = event.target.getBoundingClientRect();
      x = markRect.left + markRect.width / 2 - rect.left;
      y = markRect.top - rect.top;
    }
    tooltip.style.left = `${Math.max(8, Math.min(rect.width - 8, x))}px`;
    tooltip.style.top = `${Math.max(18, Math.min(rect.height - 8, y))}px`;
    tooltip.classList.add('is-visible');
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('is-visible');
    }
  }

  destroy() {
    if (this.destroyed) return;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.target.innerHTML = '';
    this.target.classList.remove('vd-chart-root', `vd-chart-${this.kind}`);
    this.destroyed = true;
  }
}

function createChartFactory(kind, renderer, defaults = {}) {
  return function chartFactory(options = {}) {
    return new ChartInstance(kind, { ...defaults, ...options }, renderer);
  };
}

export const BarChart = createChartFactory('bar', renderBarChart);
export const LineChart = createChartFactory('line', (instance) =>
  renderLineLikeChart(instance, 'line'),
);
export const AreaChart = createChartFactory('area', (instance) =>
  renderLineLikeChart(instance, 'area'),
);
export const ScatterChart = createChartFactory('scatter', renderScatterChart);
export const DonutChart = createChartFactory('donut', renderDonutChart, { innerRadiusRatio: 0.62 });
export const PieChart = createChartFactory('pie', renderDonutChart, { innerRadiusRatio: 0 });
