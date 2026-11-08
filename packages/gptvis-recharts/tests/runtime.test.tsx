import { act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { bindGPTVis, GPTVis } from '../src/runtime.js';

const LINE = `
vis line
data
  - time Jan
    value 10
  - time Feb
    value 20
`;

describe('imperative runtime', () => {
  it('mounts, resizes, zooms, switches type, and destroys cleanly', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const onStatus = vi.fn();
    const vis = new GPTVis({
      container,
      width: 640,
      height: 400,
      theme: 'light',
      onStatus,
    });

    await act(async () => vis.render(LINE));
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith({ state: 'ready', message: '' }),
    );
    expect(vis.getZoom()).toBe(1);

    await act(async () => vis.zoomTo(1.6));
    expect(vis.getZoom()).toBe(1.6);
    await act(async () => vis.zoomTo(100));
    expect(vis.getZoom()).toBe(5);
    await act(async () => vis.resize());

    await act(async () =>
      vis.render({
        type: 'flow-diagram',
        data: {
          nodes: [{ name: 'A' }, { name: 'B' }],
          edges: [{ source: 'A', target: 'B' }],
        },
      }),
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    expect(container.textContent).toContain('A');

    await act(async () => vis.destroy());
    expect(container.querySelector('.gvr-runtime-host')).toBeNull();
    expect(() => vis.render(LINE)).toThrow('destroyed');
    container.remove();
  });

  it('provides a bind helper with update and destroy', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const bound = bindGPTVis(container, { width: 400, height: 300, theme: 'dark' });

    await act(async () =>
      bound.update({
        type: 'pie',
        data: [
          { category: 'A', value: 1 },
          { category: 'B', value: 2 },
        ],
      }),
    );
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    await act(async () => bound.resize());
    await act(async () => bound.destroy());
    expect(container.childElementCount).toBe(0);
    container.remove();
  });
});
