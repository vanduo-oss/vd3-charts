// Charts primitives — runs in the DEFAULT node environment (no jsdom). This
// doubles as a proof that the scale/path/accessor helpers touch no DOM/window:
// if they did, importing/exercising them here would throw. Cases translated
// (and expanded, table-driven) from the old charts repo's Playwright
// `tests/unit/primitives.spec.ts` `page.evaluate` bodies.

import { describe, expect, it } from 'vitest';

import {
  createAccessor,
  scaleLinear,
  scaleTime,
  scaleBand,
  scalePoint,
  scaleOrdinal,
  ticks,
  niceDomain,
  linePath,
  areaPath,
  arcPath,
  resolveTheme,
} from '../../src/core.js';

describe('createAccessor', () => {
  it('reads a flat field by name', () => {
    expect(createAccessor('value')({ value: 42 })).toBe(42);
  });

  it('reads a nested dotted path', () => {
    expect(createAccessor('metrics.total')({ metrics: { total: 99 } })).toBe(99);
  });

  it('returns undefined for a broken nested path (no throw)', () => {
    expect(createAccessor('a.b.c')({ a: null })).toBeUndefined();
  });

  it('invokes a callback accessor', () => {
    expect(createAccessor((d: { value: number }) => d.value * 2)({ value: 21 })).toBe(42);
  });

  it('uses the fallback accessor when the primary is null/undefined', () => {
    expect(createAccessor(undefined, 'x')({ x: 5 })).toBe(5);
    expect(createAccessor(null as unknown as undefined, 'x')({ x: 7 })).toBe(7);
  });

  it('falls back to identity when neither accessor resolves to a usable form', () => {
    // Empty string is not a usable field name → identity.
    expect(createAccessor('')(123)).toBe(123);
    expect(createAccessor(undefined)(123)).toBe(123);
  });
});

describe('scaleLinear', () => {
  it('maps the domain onto the range linearly', () => {
    const scale = scaleLinear({ domain: [0, 100], range: [0, 500] });
    expect(scale(50)).toBe(250);
    expect(scale(0)).toBe(0);
    expect(scale(100)).toBe(500);
  });

  it('exposes domain and range accessors', () => {
    const scale = scaleLinear({ domain: [0, 100], range: [0, 500] });
    expect(scale.domain()).toEqual([0, 100]);
    expect(scale.range()).toEqual([0, 500]);
  });

  it('produces ticks that span the domain and include the round bounds', () => {
    const scale = scaleLinear({ domain: [0, 100], range: [0, 500] });
    expect(scale.ticks(5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('spreads a collapsed (equal-bounds) domain around its midpoint', () => {
    const scale = scaleLinear({ domain: [5, 5], range: [0, 100] });
    expect(scale(5)).toBe(50);
  });

  it('returns null for a non-finite input value', () => {
    const scale = scaleLinear({ domain: [0, 10], range: [0, 100] });
    expect(scale(Number.NaN)).toBeNull();
    expect(scale('nope' as unknown as number)).toBeNull();
  });

  it('defaults a non-finite domain bound to 0/1', () => {
    const scale = scaleLinear({ domain: [Number.NaN, Number.NaN], range: [0, 100] });
    // NaN → 0 and NaN → 1
    expect(scale(0)).toBe(0);
    expect(scale(1)).toBe(100);
  });
});

describe('scaleTime', () => {
  it('maps a Date onto the range by epoch time', () => {
    const scale = scaleTime({ domain: [new Date(0), new Date(1000)], range: [0, 100] });
    expect(scale(new Date(500))).toBe(50);
    expect(scale(new Date(0))).toBe(0);
    expect(scale(new Date(1000))).toBe(100);
  });

  it('returns Date instances from domain() and ticks()', () => {
    const scale = scaleTime({ domain: [new Date(0), new Date(1000)], range: [0, 100] });
    expect(scale.domain().every((d) => d instanceof Date)).toBe(true);
    expect(scale.ticks(4).every((d) => d instanceof Date)).toBe(true);
  });
});

describe('scaleBand', () => {
  it('places bands at the start of each slot and reports bandwidth', () => {
    const band = scaleBand({ domain: ['a', 'b'], range: [0, 200], padding: 0 });
    expect(band('a')).toBe(0);
    expect(band('b')).toBe(100);
    expect(band.bandwidth()).toBe(100);
  });

  it('returns null for a value outside the domain', () => {
    const band = scaleBand({ domain: ['a', 'b'], range: [0, 200], padding: 0 });
    expect(band('z')).toBeNull();
  });

  it('keeps bandwidth no larger than step under padding', () => {
    const band = scaleBand({ domain: ['a', 'b', 'c'], range: [0, 300], padding: 0.2 });
    expect(band.bandwidth()).toBeLessThanOrEqual(band.step());
    expect(band.bandwidth()).toBeGreaterThan(0);
  });

  it('de-duplicates the domain', () => {
    const band = scaleBand({ domain: ['a', 'a', 'b'], range: [0, 200], padding: 0 });
    expect(band.domain()).toEqual(['a', 'b']);
  });
});

describe('scalePoint', () => {
  it('spaces points evenly across the range', () => {
    const point = scalePoint({ domain: ['a', 'b', 'c'], range: [0, 100], padding: 0 });
    expect(point('a')).toBe(0);
    expect(point('b')).toBe(50);
    expect(point('c')).toBe(100);
    expect(point.bandwidth()).toBe(0);
  });

  it('centers a single-item domain in the range', () => {
    const point = scalePoint({ domain: ['only'], range: [0, 100] });
    expect(point('only')).toBe(50);
  });

  it('returns null for an unknown value', () => {
    const point = scalePoint({ domain: ['a', 'b'], range: [0, 100] });
    expect(point('z')).toBeNull();
  });
});

describe('scaleOrdinal', () => {
  it('maps known domain keys to the matching range slot', () => {
    const ordinal = scaleOrdinal({ domain: ['north'], range: ['red', 'blue'] });
    expect(ordinal('north')).toBe('red');
  });

  it('extends the domain and cycles the range for unknown keys', () => {
    const ordinal = scaleOrdinal({ domain: [], range: ['red', 'blue'] });
    expect(ordinal('x')).toBe('red');
    expect(ordinal('y')).toBe('blue');
    expect(ordinal('z')).toBe('red'); // cycles back to slot 0
    expect(ordinal('x')).toBe('red'); // stable for a repeated key
  });

  it('falls back to the default palette when no range is given', () => {
    const ordinal = scaleOrdinal({ domain: ['a'] });
    expect(ordinal('a')).toBe('#5c7cfa');
  });
});

describe('ticks', () => {
  it('returns evenly spaced round values covering the range', () => {
    expect(ticks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it('handles a fractional range', () => {
    expect(ticks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('reverses the output for a descending range', () => {
    expect(ticks(100, 0, 5)).toEqual([100, 80, 60, 40, 20, 0]);
  });

  it('returns a single value when min equals max', () => {
    expect(ticks(5, 5)).toEqual([5]);
  });

  it('returns an empty array for non-finite bounds', () => {
    expect(ticks(Number.NaN, 10)).toEqual([]);
    expect(ticks(0, Number.POSITIVE_INFINITY)).toEqual([]);
  });
});

describe('niceDomain', () => {
  it('rounds outward to nice bounds', () => {
    expect(niceDomain([1, 8, 17])).toEqual([0, 18]);
  });

  it('forces zero into the domain with the boolean shorthand', () => {
    expect(niceDomain([10, 20, 30], true)).toEqual([0, 30]);
    expect(niceDomain([-5, -20], true)).toEqual([-20, 0]);
  });

  it('pins an explicit min/max exactly (no nice-rounding of that bound)', () => {
    expect(niceDomain([3, 5], { min: 0, max: 10 })).toEqual([0, 10]);
  });

  it('returns [0, 1] for empty input, or the pinned bounds if provided', () => {
    expect(niceDomain([])).toEqual([0, 1]);
    expect(niceDomain([], { min: 5, max: 9 })).toEqual([5, 9]);
  });

  it('pads a single-value dataset so min !== max', () => {
    const [min, max] = niceDomain([10]);
    expect(min).toBeLessThan(10);
    expect(max).toBeGreaterThan(10);
  });

  it('ignores non-numeric entries (numeric strings coerced, junk dropped)', () => {
    // 'x' and null are dropped; '5' coerces to 5 → same result as [5, 15].
    expect(niceDomain(['5', 'x', 15, null])).toEqual(niceDomain([5, 15]));
    expect(niceDomain(['5', 'x', 15, null])).toEqual([4, 16]);
  });
});

describe('linePath', () => {
  it('emits an M then L commands', () => {
    expect(
      linePath([
        { x: 0, y: 10 },
        { x: 20, y: 30 },
      ]),
    ).toBe('M0,10 L20,30');
  });

  it('drops non-finite points', () => {
    expect(
      linePath([
        { x: 0, y: 10 },
        { x: Number.NaN, y: 5 },
        { x: 20, y: 30 },
      ]),
    ).toBe('M0,10 L20,30');
  });

  it('returns an empty string when there are no finite points', () => {
    expect(linePath([])).toBe('');
    expect(linePath([{ x: Number.NaN, y: Number.NaN }])).toBe('');
  });
});

describe('areaPath', () => {
  it('closes the line down to the baseline and back with Z', () => {
    expect(
      areaPath(
        [
          { x: 0, y: 10 },
          { x: 20, y: 30 },
        ],
        40,
      ),
    ).toBe('M0,10 L20,30 L20,40 L0,40 Z');
  });

  it('always ends with a Z close command', () => {
    const d = areaPath(
      [
        { x: 0, y: 5 },
        { x: 10, y: 8 },
        { x: 20, y: 3 },
      ],
      50,
    );
    expect(d.endsWith('Z')).toBe(true);
  });

  it('returns an empty string for a non-finite baseline or no points', () => {
    expect(areaPath([{ x: 0, y: 10 }], Number.NaN)).toBe('');
    expect(areaPath([], 40)).toBe('');
  });
});

describe('arcPath', () => {
  it('draws a donut slice with two arcs when innerRadius > 0', () => {
    const d = arcPath(50, 50, 40, 20, -Math.PI / 2, Math.PI / 2);
    expect(d).toContain('A40,40'); // outer arc
    expect(d).toContain('A20,20'); // inner arc
    // two arc commands for a donut ring
    expect(d.match(/A/g)).toHaveLength(2);
  });

  it('draws a pie slice from the center with a single arc when innerRadius <= 0', () => {
    const d = arcPath(50, 50, 40, 0, -Math.PI / 2, Math.PI / 2);
    expect(d.startsWith('M50,50')).toBe(true); // starts at the center
    expect(d).toContain('A40,40');
    expect(d.match(/A/g)).toHaveLength(1);
  });

  it('returns an empty string for a non-positive radius or empty sweep', () => {
    expect(arcPath(0, 0, 0, 0, 0, 1)).toBe('');
    expect(arcPath(0, 0, 10, 0, 1, 1)).toBe('');
  });

  it('clamps a full-circle sweep instead of self-closing', () => {
    const d = arcPath(0, 0, 10, 0, 0, Math.PI * 2);
    expect(d).not.toBe('');
    expect(d).toContain('A10,10');
  });
});

describe('resolveTheme (no DOM / node environment)', () => {
  it('returns the built-in defaults when there is no window', () => {
    const theme = resolveTheme(null);
    expect(theme.textColor).toBe('#1a1d20');
    expect(theme.mutedTextColor).toBe('#868e96');
    expect(theme.backgroundColor).toBe('#ffffff');
    expect(theme.colors[0]).toBe('#5c7cfa');
    expect(theme.colors).toHaveLength(8);
  });

  it('merges overrides over the defaults', () => {
    const theme = resolveTheme(null, { textColor: '#000000', colors: ['#abcdef'] });
    expect(theme.textColor).toBe('#000000');
    expect(theme.colors).toEqual(['#abcdef']);
    // untouched default preserved
    expect(theme.backgroundColor).toBe('#ffffff');
  });
});
