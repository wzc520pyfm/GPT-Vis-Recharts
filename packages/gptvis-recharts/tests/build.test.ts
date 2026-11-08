import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build/index.js';
import type {
  BarModel,
  DistributionModel,
  DualAxesModel,
  GraphModel,
  HistogramModel,
  LineModel,
  SankeyModel,
  SummaryModel,
  TableModel,
  TreeModel,
  VennModel,
  WaterfallModel,
  WordCloudModel,
} from '../src/build/index.js';

function ready<T>(config: Record<string, unknown>): T {
  const view = buildView(config);
  if (view.kind !== 'ready') throw new Error(`Expected ready, got ${view.kind}: ${view.message}`);
  return view.model as T;
}

describe('cartesian models', () => {
  it('pivots grouped line series in first-seen order', () => {
    const model = ready<LineModel>({
      type: 'line',
      data: [
        { time: '1月', value: 10, group: 'A' },
        { time: '1月', value: 20, group: 'B' },
        { time: '2月', value: 12, group: 'A' },
        { time: '2月', value: 22, group: 'B' },
      ],
    });
    expect(model.series.map((item) => item.label)).toEqual(['A', 'B']);
    expect(model.data).toEqual([
      { category: '1月', series_0: 10, series_1: 20 },
      { category: '2月', series_0: 12, series_1: 22 },
    ]);
  });

  it('keeps bar and column layout semantics', () => {
    const bar = ready<BarModel>({
      type: 'bar',
      stack: true,
      data: [
        { category: 'A', value: 1, group: 'one' },
        { category: 'A', value: 2, group: 'two' },
      ],
    });
    expect(bar.layout).toBe('vertical');
    expect(bar.stacked).toBe(true);
    expect(bar.data[0]).toMatchObject({ category: 'A', series_0: 1, series_1: 2 });
  });

  it('computes waterfall totals and negative segments', () => {
    const model = ready<WaterfallModel>({
      type: 'waterfall',
      data: [
        { category: '收入', value: 100, isTotal: true },
        { category: '成本', value: -30 },
        { category: '利润', isTotal: true },
      ],
    });
    expect(model.data).toMatchObject([
      { category: '收入', start: 0, end: 100, kind: 'total' },
      { category: '成本', start: 100, end: 70, base: 70, size: 30, kind: 'negative' },
      { category: '利润', start: 0, end: 70, kind: 'total' },
    ]);
  });

  it('builds dual-axis rows and independent axes', () => {
    const model = ready<DualAxesModel>({
      type: 'dual-axes',
      categories: ['Q1', 'Q2'],
      series: [
        { type: 'column', axisYTitle: 'Revenue', data: [10, 20] },
        { type: 'line', axisYTitle: 'Rate', data: [0.1, 0.2] },
      ],
    });
    expect(model.data).toEqual([
      { category: 'Q1', series_0: 10, series_1: 0.1 },
      { category: 'Q2', series_0: 20, series_1: 0.2 },
    ]);
    expect(model.leftAxisTitle).toBe('Revenue');
    expect(model.rightAxisTitle).toBe('Rate');
  });

  it('computes equal-width histogram bins', () => {
    const model = ready<HistogramModel>({
      type: 'histogram',
      data: [1, 2, 3, 4],
      binNumber: 2,
    });
    expect(model.data.map((bin) => bin.count)).toEqual([2, 2]);
    expect(model.data[0]?.start).toBe(1);
    expect(model.data[1]?.end).toBe(4);
  });
});

describe('distribution models', () => {
  it('computes quartiles, whiskers, and density', () => {
    const model = ready<DistributionModel>({
      type: 'violin',
      data: [1, 2, 3, 4, 5, 100].map((value) => ({ category: 'A', value })),
    });
    const group = model.groups[0];
    expect(group?.median).toBe(3.5);
    expect(group?.outliers).toEqual([100]);
    expect(group?.density.length).toBeGreaterThan(10);
    expect(group?.density.some((point) => point.density > 0.5)).toBe(true);
  });
});

describe('relationship, hierarchy, and text models', () => {
  it('normalizes Venn sets and merges duplicate regions', () => {
    const model = ready<VennModel>({
      type: 'venn',
      data: [
        { sets: 'A', value: 10 },
        { sets: 'B', value: 8 },
        { sets: 'A B', value: 2 },
        { sets: ['A', 'B'], value: 3 },
      ],
    });
    expect(model.sets).toEqual(['A', 'B']);
    expect(model.regions.find((region) => region.sets.length === 2)?.value).toBe(5);
  });

  it('builds Sankey node indexes and links', () => {
    const model = ready<SankeyModel>({
      type: 'sankey',
      data: [
        { source: 'A', target: 'B', value: 3 },
        { source: 'B', target: 'C', value: 2 },
      ],
    });
    expect(model.nodes.map((node) => node.name)).toEqual(['A', 'B', 'C']);
    expect(model.links).toEqual([
      { source: 0, target: 1, value: 3 },
      { source: 1, target: 2, value: 2 },
    ]);
  });

  it('drops edges that reference undeclared graph nodes', () => {
    const model = ready<GraphModel>({
      type: 'network-graph',
      data: {
        nodes: [{ name: 'A' }, { name: 'B' }],
        edges: [
          { source: 'A', target: 'B' },
          { source: 'A', target: 'Missing' },
        ],
      },
    });
    expect(model.edges).toEqual([{ source: 'A', target: 'B' }]);
  });

  it('normalizes one-element tree arrays and rejects multiple roots', () => {
    const model = ready<TreeModel>({
      type: 'mindmap',
      data: [{ name: 'Root', children: [{ name: 'Child' }] }],
    });
    expect(model.root.children?.[0]?.name).toBe('Child');
    expect(() => buildView({ type: 'mindmap', data: [{ name: 'A' }, { name: 'B' }] })).not.toThrow();
    const invalid = buildView({ type: 'mindmap', data: [{ name: 'A' }, { name: 'B' }] });
    expect(invalid.kind).toBe('error');
  });

  it('aggregates and limits word-cloud entries', () => {
    const data = Array.from({ length: 60 }, (_, index) => ({
      text: `word-${index}`,
      value: 60 - index,
    }));
    const model = ready<WordCloudModel>({ type: 'word-cloud', data });
    expect(model.data).toHaveLength(50);
    expect(model.data[0]?.text).toBe('word-0');
  });

  it('discovers table columns and safely serializes values', () => {
    const source = JSON.parse(
      '[{"name":"A","__proto__":{"polluted":true},"tags":["x","y"]},{"name":"B","score":2}]',
    ) as Array<Record<string, unknown>>;
    const model = ready<TableModel>({ type: 'table', data: source });
    expect(model.columns).toEqual(['name', '__proto__', 'tags', 'score']);
    expect(model.rows[0]?.tags).toBe('x, y');
    expect(Object.prototype.hasOwnProperty.call(model.rows[0], '__proto__')).toBe(true);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('keeps summary content as text', () => {
    const model = ready<SummaryModel>({
      type: 'summary',
      content: '# Report\n\nRevenue reached [¥10万](metric_value, origin=100000).',
    });
    expect(model.content).toContain('Revenue reached');
  });
});

describe('build states', () => {
  it('returns pending for streaming input without data', () => {
    const view = buildView('vis line\ntitle Sales', { streaming: true });
    expect(view).toMatchObject({ kind: 'pending' });
  });

  it('returns unsupported for unknown chart types', () => {
    expect(buildView({ type: 'heatmap', data: [] })).toMatchObject({ kind: 'unsupported' });
  });

  it('returns an error state for invalid limits', () => {
    const view = buildView({
      type: 'column',
      data: Array.from({ length: 10_001 }, () => ({ category: 'A', value: 1 })),
    });
    expect(view.kind).toBe('error');
  });
});
