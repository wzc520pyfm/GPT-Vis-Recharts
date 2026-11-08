import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build/index.js';
import type { ChartModel } from '../src/build/index.js';
import { AreaView } from '../src/render/recharts/AreaView.js';
import { BarView } from '../src/render/recharts/BarView.js';
import { DualAxesView } from '../src/render/recharts/DualAxesView.js';
import { FunnelView } from '../src/render/recharts/FunnelView.js';
import { HistogramView } from '../src/render/recharts/HistogramView.js';
import { LineView } from '../src/render/recharts/LineView.js';
import { PieView } from '../src/render/recharts/PieView.js';
import { RadarView } from '../src/render/recharts/RadarView.js';
import { SankeyView } from '../src/render/recharts/SankeyView.js';
import { ScatterView } from '../src/render/recharts/ScatterView.js';
import { TreemapView } from '../src/render/recharts/TreemapView.js';
import { WaterfallView } from '../src/render/recharts/WaterfallView.js';
import type {
  BarModel,
  DualAxesModel,
  FunnelModel,
  HistogramModel,
  LineModel,
  PieModel,
  RadarModel,
  SankeyModel,
  ScatterModel,
  TreemapModel,
  WaterfallModel,
} from '../src/build/index.js';

function model<T extends ChartModel>(config: Record<string, unknown>): T {
  const view = buildView(config);
  if (view.kind !== 'ready') throw new Error(view.message);
  return view.model as T;
}

function expectSvg(node: ReactElement) {
  const { container, unmount } = render(node);
  expect(container.querySelector('svg')).toBeTruthy();
  unmount();
}

describe('Recharts renderers', () => {
  it('renders line and area', () => {
    const config = {
      type: 'line',
      data: [
        { time: 'Jan', value: 10, group: 'A' },
        { time: 'Feb', value: 12, group: 'A' },
      ],
    };
    expectSvg(<LineView model={model<LineModel>(config)} />);
    expectSvg(<AreaView model={model<LineModel>({ ...config, type: 'area' })} />);
  });

  it('renders column and bar', () => {
    const config = {
      type: 'column',
      data: [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
      ],
    };
    expectSvg(<BarView model={model<BarModel>(config)} />);
    expectSvg(<BarView model={model<BarModel>({ ...config, type: 'bar' })} />);
  });

  it('renders pie, scatter, radar, funnel, and histogram', () => {
    expectSvg(
      <PieView
        model={model<PieModel>({
          type: 'pie',
          data: [
            { category: 'A', value: 1 },
            { category: 'B', value: 2 },
          ],
        })}
      />,
    );
    expectSvg(
      <ScatterView
        model={model<ScatterModel>({
          type: 'scatter',
          data: [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
          ],
        })}
      />,
    );
    expectSvg(
      <RadarView
        model={model<RadarModel>({
          type: 'radar',
          data: [
            { name: 'Speed', value: 8 },
            { name: 'Cost', value: 6 },
            { name: 'Scale', value: 7 },
          ],
        })}
      />,
    );
    expectSvg(
      <FunnelView
        model={model<FunnelModel>({
          type: 'funnel',
          data: [
            { category: 'Visit', value: 100 },
            { category: 'Buy', value: 40 },
          ],
        })}
      />,
    );
    expectSvg(
      <HistogramView
        model={model<HistogramModel>({ type: 'histogram', data: [1, 2, 3, 4] })}
      />,
    );
  });

  it('renders waterfall and dual axes', () => {
    expectSvg(
      <WaterfallView
        model={model<WaterfallModel>({
          type: 'waterfall',
          data: [
            { category: 'Revenue', value: 100, isTotal: true },
            { category: 'Cost', value: -30 },
          ],
        })}
      />,
    );
    expectSvg(
      <DualAxesView
        model={model<DualAxesModel>({
          type: 'dual-axes',
          categories: ['Q1', 'Q2'],
          series: [
            { type: 'column', data: [1, 2] },
            { type: 'line', data: [0.1, 0.2] },
          ],
        })}
      />,
    );
  });

  it('renders treemap and sankey', () => {
    expectSvg(
      <TreemapView
        model={model<TreemapModel>({
          type: 'treemap',
          data: [
            { name: 'A', value: 10 },
            { name: 'B', value: 20 },
          ],
        })}
      />,
    );
    expectSvg(
      <SankeyView
        model={model<SankeyModel>({
          type: 'sankey',
          data: [
            { source: 'A', target: 'B', value: 10 },
            { source: 'B', target: 'C', value: 6 },
          ],
        })}
      />,
    );
  });
});
