import type { CSSProperties, ReactElement } from 'react';
import type { ChartModel, VisView } from '../build/types.js';
import type { ResolvedTheme } from '../types/theme.js';
import { StatusView } from './StatusView.js';
import { AreaView } from './recharts/AreaView.js';
import { BarView } from './recharts/BarView.js';
import { DualAxesView } from './recharts/DualAxesView.js';
import { FunnelView } from './recharts/FunnelView.js';
import { HistogramView } from './recharts/HistogramView.js';
import { LineView } from './recharts/LineView.js';
import { PieView } from './recharts/PieView.js';
import { RadarView } from './recharts/RadarView.js';
import { SankeyView } from './recharts/SankeyView.js';
import { ScatterView } from './recharts/ScatterView.js';
import { TreemapView } from './recharts/TreemapView.js';
import { WaterfallView } from './recharts/WaterfallView.js';
import { BoxplotView } from './svg/BoxplotView.js';
import { FishboneView } from './svg/FishboneView.js';
import { FlowView } from './svg/FlowView.js';
import { LiquidView } from './svg/LiquidView.js';
import { MindmapView } from './svg/MindmapView.js';
import { NetworkView } from './svg/NetworkView.js';
import { OrganizationView } from './svg/OrganizationView.js';
import { VennView } from './svg/VennView.js';
import { ViolinView } from './svg/ViolinView.js';
import { WordCloudView } from './svg/WordCloudView.js';
import { IndentedTreeView } from './html/IndentedTreeView.js';
import { SummaryView } from './html/SummaryView.js';
import { TableView } from './html/TableView.js';

const EMPTY_MESSAGE = {
  'en-US': 'No usable data to render.',
  'zh-CN': '暂无可渲染的数据。',
} as const;

const ZOOMABLE = new Set<ChartModel['type']>([
  'flow-diagram',
  'network-graph',
  'mindmap',
  'indented-tree',
  'organization-chart',
  'fishbone-diagram',
]);

export interface VisRendererProps {
  view: VisView;
  theme: ResolvedTheme;
  streaming?: boolean;
  zoom?: number;
  className?: string;
  style?: CSSProperties;
}

export function isZoomableChart(type: ChartModel['type']): boolean {
  return ZOOMABLE.has(type);
}

export function isChartModelEmpty(model: ChartModel): boolean {
  switch (model.type) {
    case 'line':
    case 'area':
      return model.data.length === 0 || model.series.length === 0;
    case 'column':
    case 'bar':
      return model.data.length === 0 || model.series.length === 0;
    case 'pie':
      return model.data.length === 0;
    case 'scatter':
      return model.series.length === 0 || model.series.every((series) => series.points.length === 0);
    case 'radar':
      return model.indicators.length === 0 || model.series.length === 0;
    case 'funnel':
      return model.data.length === 0;
    case 'waterfall':
      return model.data.length === 0;
    case 'dual-axes':
      return model.data.length === 0 || model.series.length === 0;
    case 'histogram':
      return model.data.length === 0;
    case 'boxplot':
    case 'violin':
      return model.groups.length === 0;
    case 'venn':
      return model.sets.length === 0 || model.regions.length === 0;
    case 'sankey':
      return model.nodes.length === 0 || model.links.length === 0;
    case 'treemap':
      return model.data.length === 0;
    case 'word-cloud':
      return model.data.length === 0;
    case 'liquid':
      return false;
    case 'flow-diagram':
    case 'network-graph':
      return model.nodes.length === 0;
    case 'mindmap':
    case 'indented-tree':
    case 'organization-chart':
    case 'fishbone-diagram':
      return !model.root.name;
    case 'table':
      return model.rows.length === 0;
    case 'summary':
      return !model.content.trim();
  }
}

function localeKey(locale: string): keyof typeof EMPTY_MESSAGE {
  return locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

function renderModel(model: ChartModel, streaming: boolean): ReactElement {
  switch (model.type) {
    case 'line':
      return <LineView model={model} streaming={streaming} />;
    case 'area':
      return <AreaView model={model} streaming={streaming} />;
    case 'column':
    case 'bar':
      return <BarView model={model} streaming={streaming} />;
    case 'pie':
      return <PieView model={model} streaming={streaming} />;
    case 'scatter':
      return <ScatterView model={model} streaming={streaming} />;
    case 'radar':
      return <RadarView model={model} streaming={streaming} />;
    case 'funnel':
      return <FunnelView model={model} streaming={streaming} />;
    case 'waterfall':
      return <WaterfallView model={model} streaming={streaming} />;
    case 'dual-axes':
      return <DualAxesView model={model} streaming={streaming} />;
    case 'histogram':
      return <HistogramView model={model} streaming={streaming} />;
    case 'boxplot':
      return <BoxplotView model={model} />;
    case 'violin':
      return <ViolinView model={model} />;
    case 'venn':
      return <VennView model={model} />;
    case 'sankey':
      return <SankeyView model={model} streaming={streaming} />;
    case 'treemap':
      return <TreemapView model={model} streaming={streaming} />;
    case 'word-cloud':
      return <WordCloudView model={model} />;
    case 'liquid':
      return <LiquidView model={model} />;
    case 'flow-diagram':
      return <FlowView model={model} />;
    case 'network-graph':
      return <NetworkView model={model} />;
    case 'mindmap':
      return <MindmapView model={model} />;
    case 'indented-tree':
      return <IndentedTreeView model={model} />;
    case 'organization-chart':
      return <OrganizationView model={model} />;
    case 'fishbone-diagram':
      return <FishboneView model={model} />;
    case 'table':
      return <TableView model={model} />;
    case 'summary':
      return <SummaryView model={model} />;
  }
}

export function VisRenderer({
  view,
  theme,
  streaming = false,
  zoom = 1,
  className,
  style,
}: VisRendererProps) {
  if (view.kind !== 'ready') {
    return (
      <div className={className} style={style}>
        <StatusView
          state={view.kind}
          message={view.message}
          title={view.meta.title}
          subtitle={view.meta.subtitle}
          theme={theme}
        />
      </div>
    );
  }

  if (isChartModelEmpty(view.model)) {
    return (
      <div className={className} style={style}>
        <StatusView
          state="empty"
          message={EMPTY_MESSAGE[localeKey(view.meta.locale)]}
          title={view.model.title}
          subtitle={view.model.subtitle}
          theme={view.model.theme}
        />
      </div>
    );
  }

  const content = renderModel(view.model, streaming);
  if (!isZoomableChart(view.model.type) || zoom === 1) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', ...style }}>
        {content}
      </div>
    );
  }

  const safeZoom = Math.max(0.1, Math.min(5, zoom));
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        ...style,
      }}
    >
      <div
        style={{
          width: `${safeZoom * 100}%`,
          height: `${safeZoom * 100}%`,
        }}
      >
        <div
          style={{
            width: `${100 / safeZoom}%`,
            height: `${100 / safeZoom}%`,
            transform: `scale(${safeZoom})`,
            transformOrigin: 'top left',
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
