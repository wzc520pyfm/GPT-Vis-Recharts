import { act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import * as API from '../src/index.js';
import type { LineConfig } from '../src/index.js';

const CONSTRUCTORS = [
  'Line',
  'Area',
  'Column',
  'Bar',
  'Pie',
  'Scatter',
  'Radar',
  'Funnel',
  'Waterfall',
  'DualAxes',
  'Histogram',
  'Boxplot',
  'Violin',
  'Venn',
  'Sankey',
  'Treemap',
  'WordCloud',
  'Liquid',
  'FlowDiagram',
  'NetworkGraph',
  'Mindmap',
  'IndentedTree',
  'OrganizationChart',
  'FishboneDiagram',
  'Table',
  'Summary',
] as const;

describe('public API', () => {
  it('exports all 26 constructors and the shared parser/runtime APIs', () => {
    expect(CONSTRUCTORS).toHaveLength(26);
    for (const name of CONSTRUCTORS) {
      expect(typeof (API as unknown as Record<string, unknown>)[name]).toBe('function');
    }
    expect(typeof API.GPTVis).toBe('function');
    expect(typeof API.bindGPTVis).toBe('function');
    expect(typeof API.GPTVisChart).toBe('function');
    expect(typeof API.parse).toBe('function');
    expect(typeof API.readConfig).toBe('function');
    expect(typeof API.resolveTheme).toBe('function');
  });

  it('merges the constructor type into object input', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = API.Line({ container, width: 480, height: 320, theme: 'light' });
    const config: LineConfig = {
      title: 'Constructor line',
      data: [
        { time: 'Jan', value: 12 },
        { time: 'Feb', value: 18 },
      ],
    };

    await act(async () => chart.render(config));
    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
    expect(container.textContent).toContain('Constructor line');
    await act(async () => chart.destroy());
    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it('renders plain summary text through the Summary constructor', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = API.Summary({ container, width: 480, height: 320, theme: 'paper' });

    await act(async () =>
      chart.render('Revenue reached [¥10万](metric_value, origin=100000).'),
    );
    await waitFor(() => expect(container.textContent).toContain('Revenue reached'));
    expect(container.querySelector('[data-entity-type="metric_value"]')).toBeTruthy();
    await act(async () => chart.destroy());
    container.remove();
  });
});
