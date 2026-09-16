// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { BarChart, VdBarChart } from '../../src/index.js';

const hosts: HTMLElement[] = [];
const charts: ReturnType<typeof BarChart>[] = [];
function chart(responsive = true) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  hosts.push(target);
  const result = BarChart({
    target,
    responsive,
    data: [
      { id: 'a', x: 'A', y: 1 },
      { id: 'b', x: 'B', y: 2 },
    ],
    x: 'x',
    y: 'y',
  });
  charts.push(result);
  return result;
}
afterEach(() => {
  charts.splice(0).forEach((c) => c.destroy());
  hosts.splice(0).forEach((h) => h.remove());
  vi.unstubAllGlobals();
});

describe('chart updates', () => {
  it('starts and stops observing when responsive changes', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe;
        disconnect = disconnect;
      },
    );
    const instance = chart(false);
    expect(observe).not.toHaveBeenCalled();
    instance.update({ responsive: true });
    expect(observe).toHaveBeenCalledTimes(1);
    instance.update({ title: 'New title' });
    expect(observe).toHaveBeenCalledTimes(1);
    instance.update({ responsive: false });
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('preserves focused identity through reorder and uses a neighbor on removal', () => {
    const instance = chart();
    (instance.target.querySelectorAll('.vd-chart-bar')[1] as HTMLElement).focus();
    instance.update({
      data: [
        { id: 'b', x: 'B renamed', y: 3 },
        { id: 'a', x: 'A', y: 1 },
      ],
    });
    expect(document.activeElement?.getAttribute('aria-label')).toContain('B renamed');
    instance.update({ data: [{ id: 'a', x: 'A', y: 1 }] });
    expect(document.activeElement?.getAttribute('aria-label')).toContain('A');
    instance.update({ data: [] });
    expect(document.activeElement?.tagName.toLowerCase()).toBe('svg');
  });

  it('refreshes a typed Vue component after theme-only changes', () => {
    const wrapper = mount(VdBarChart, {
      attachTo: document.body,
      props: { data: [{ x: 'A', y: 1 }], x: 'x', y: 'y' },
    });
    const host = wrapper.element as HTMLElement;
    host.style.setProperty('--vd-chart-1', '#123456');
    wrapper.vm.refresh();
    expect(wrapper.get('rect.vd-chart-bar').attributes('fill')).toBe('#123456');
    wrapper.unmount();
  });
});
