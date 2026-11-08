import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build/index.js';
import { VisRenderer, isChartModelEmpty } from '../src/render/VisRenderer.js';
import { resolveTheme } from '../src/theme/index.js';

const CONFIGS: Record<string, Record<string, unknown>> = {
  line: {
    type: 'line',
    data: [
      { time: 'Jan', value: 12 },
      { time: 'Feb', value: 18 },
    ],
  },
  area: {
    type: 'area',
    stack: true,
    data: [
      { time: 'Jan', value: 12, group: 'A' },
      { time: 'Jan', value: 8, group: 'B' },
      { time: 'Feb', value: 18, group: 'A' },
      { time: 'Feb', value: 11, group: 'B' },
    ],
  },
  column: {
    type: 'column',
    label: true,
    data: [
      { category: 'A', value: 12 },
      { category: 'B', value: 18 },
    ],
  },
  bar: {
    type: 'bar',
    data: [
      { category: 'A', value: 12 },
      { category: 'B', value: 18 },
    ],
  },
  pie: {
    type: 'pie',
    innerRadius: 0.45,
    data: [
      { category: 'A', value: 12 },
      { category: 'B', value: 18 },
    ],
  },
  scatter: {
    type: 'scatter',
    data: [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ],
  },
  radar: {
    type: 'radar',
    data: [
      { name: 'Speed', value: 8 },
      { name: 'Scale', value: 6 },
      { name: 'Cost', value: 7 },
    ],
  },
  funnel: {
    type: 'funnel',
    data: [
      { category: 'Visit', value: 100 },
      { category: 'Buy', value: 36 },
    ],
  },
  waterfall: {
    type: 'waterfall',
    data: [
      { category: 'Revenue', value: 100, isTotal: true },
      { category: 'Cost', value: -30 },
      { category: 'Profit', value: 70, isTotal: true },
    ],
  },
  'dual-axes': {
    type: 'dual-axes',
    categories: ['Q1', 'Q2'],
    series: [
      { type: 'column', axisYTitle: 'Revenue', data: [10, 20] },
      { type: 'line', axisYTitle: 'Rate', data: [0.1, 0.2] },
    ],
  },
  histogram: {
    type: 'histogram',
    data: [1, 2, 3, 4, 5, 6],
    binNumber: 3,
  },
  boxplot: {
    type: 'boxplot',
    data: [1, 2, 3, 4, 5, 20].map((value) => ({ category: 'A', value })),
  },
  violin: {
    type: 'violin',
    data: [1, 2, 3, 4, 5, 8].map((value) => ({ category: 'A', value })),
  },
  venn: {
    type: 'venn',
    data: [
      { sets: 'A', value: 10 },
      { sets: 'B', value: 8 },
      { sets: ['A', 'B'], value: 3 },
    ],
  },
  sankey: {
    type: 'sankey',
    data: [
      { source: 'A', target: 'B', value: 3 },
      { source: 'B', target: 'C', value: 2 },
    ],
  },
  treemap: {
    type: 'treemap',
    data: [
      {
        name: 'Root',
        children: [
          { name: 'A', value: 10 },
          { name: 'B', value: 7 },
        ],
      },
    ],
  },
  'word-cloud': {
    type: 'word-cloud',
    data: ['data', 'charts', 'streaming', 'react', 'recharts'].map((text, index) => ({
      text,
      value: 10 - index,
    })),
  },
  liquid: { type: 'liquid', percent: 0.62, shape: 'circle' },
  'flow-diagram': {
    type: 'flow-diagram',
    data: {
      nodes: [{ name: 'Start' }, { name: 'Done' }],
      edges: [{ source: 'Start', target: 'Done', name: 'next' }],
    },
  },
  'network-graph': {
    type: 'network-graph',
    layout: 'circular',
    data: {
      nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      edges: [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
      ],
    },
  },
  mindmap: {
    type: 'mindmap',
    data: { name: 'Root', children: [{ name: 'A' }, { name: 'B' }] },
  },
  'indented-tree': {
    type: 'indented-tree',
    data: { name: 'Root', children: [{ name: 'A' }, { name: 'B' }] },
  },
  'organization-chart': {
    type: 'organization-chart',
    data: {
      name: 'CEO',
      description: 'Company',
      children: [{ name: 'Engineering' }, { name: 'Sales' }],
    },
  },
  'fishbone-diagram': {
    type: 'fishbone-diagram',
    data: {
      name: 'Late delivery',
      children: [
        { name: 'People', children: [{ name: 'Staffing' }] },
        { name: 'Process', children: [{ name: 'Handoff' }] },
      ],
    },
  },
  table: {
    type: 'table',
    data: [
      { Name: 'A', Value: 10 },
      { Name: 'B', Value: 20 },
    ],
  },
  summary: {
    type: 'summary',
    content:
      '# Report\n\nRevenue reached [¥10万](metric_value, origin=100000, assessment="positive").',
  },
};

describe('all 26 chart renderers', () => {
  it('contains a configuration for every supported chart type', () => {
    expect(Object.keys(CONFIGS)).toHaveLength(26);
  });

  for (const [name, config] of Object.entries(CONFIGS)) {
    it(`renders ${name}`, () => {
      const view = buildView(config);
      expect(view.kind).toBe('ready');
      if (view.kind !== 'ready') return;
      expect(isChartModelEmpty(view.model)).toBe(false);
      const { container, unmount } = render(
        <VisRenderer view={view} theme={view.model.theme} />,
      );
      expect(container.querySelector('.gvr-frame')).toBeTruthy();
      if (['table', 'summary', 'indented-tree'].includes(view.model.type)) {
        expect(container.querySelector('svg')).toBeNull();
      } else {
        expect(container.querySelector('svg')).toBeTruthy();
      }
      unmount();
    });
  }

  it('renders accessible empty and error states', () => {
    const empty = buildView({ type: 'line', data: [] });
    const { container, unmount } = render(
      <VisRenderer view={empty} theme={resolveTheme('light')} />,
    );
    expect(container.textContent).toContain('No usable data');
    unmount();

    const error = buildView({
      type: 'line',
      data: Array.from({ length: 10_001 }, () => ({ time: 'A', value: 1 })),
    });
    const rendered = render(<VisRenderer view={error} theme={resolveTheme('dark')} />);
    expect(rendered.container.querySelector('[role="alert"]')).toBeTruthy();
    rendered.unmount();
  });
});
