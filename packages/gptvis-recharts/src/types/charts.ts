import type { ThemeStyle, VisualizationTheme } from './theme.js';

export type VisualizationInput = string | object;

export type ChartType =
  | 'area'
  | 'bar'
  | 'boxplot'
  | 'column'
  | 'dual-axes'
  | 'fishbone-diagram'
  | 'flow-diagram'
  | 'funnel'
  | 'histogram'
  | 'indented-tree'
  | 'line'
  | 'liquid'
  | 'mindmap'
  | 'network-graph'
  | 'organization-chart'
  | 'pie'
  | 'radar'
  | 'sankey'
  | 'scatter'
  | 'summary'
  | 'table'
  | 'treemap'
  | 'venn'
  | 'violin'
  | 'waterfall'
  | 'word-cloud';

export interface BaseChartConfig<T extends ChartType> {
  type?: T;
  title?: string;
  subtitle?: string;
  theme?: VisualizationTheme;
  style?: ThemeStyle;
}

export interface LineDataItem {
  time: string | number;
  value: number;
  group?: string;
}

export interface LineConfig extends BaseChartConfig<'line'> {
  data: LineDataItem[];
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface AreaConfig extends BaseChartConfig<'area'> {
  data: LineDataItem[];
  stack?: boolean;
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface CategoryDataItem {
  category: string;
  value: number;
  group?: string;
}

export interface ColumnConfig extends BaseChartConfig<'column'> {
  data: CategoryDataItem[];
  group?: boolean;
  stack?: boolean;
  label?: boolean;
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface BarConfig extends BaseChartConfig<'bar'> {
  data: CategoryDataItem[];
  group?: boolean;
  stack?: boolean;
  label?: boolean;
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface PieConfig extends BaseChartConfig<'pie'> {
  data: Array<{ category: string; value: number }>;
  innerRadius?: number;
}

export interface ScatterDataItem {
  x: number;
  y: number;
  group?: string;
}

export interface ScatterConfig extends BaseChartConfig<'scatter'> {
  data: ScatterDataItem[];
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface RadarDataItem {
  name: string;
  value: number;
  group?: string;
}

export interface RadarConfig extends BaseChartConfig<'radar'> {
  data: RadarDataItem[];
  align?: boolean;
}

export interface FunnelConfig extends BaseChartConfig<'funnel'> {
  data: Array<{ category: string; value: number }>;
  conversionRateLabel?: string;
}

export interface WaterfallDataItem {
  category: string;
  value?: number;
  isTotal?: boolean;
  isIntermediateTotal?: boolean;
}

export interface WaterfallConfig extends BaseChartConfig<'waterfall'> {
  data: WaterfallDataItem[];
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface DualAxesSeriesItem {
  type: 'line' | 'column';
  data: number[];
  axisYTitle?: string;
}

export interface DualAxesConfig extends BaseChartConfig<'dual-axes'> {
  categories: string[];
  series: DualAxesSeriesItem[];
  axisXTitle?: string;
}

export interface HistogramConfig extends BaseChartConfig<'histogram'> {
  data: number[];
  binNumber?: number;
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface DistributionDataItem {
  category: string;
  value: number;
  group?: string;
}

export interface BoxplotConfig extends BaseChartConfig<'boxplot'> {
  data: DistributionDataItem[];
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface ViolinConfig extends BaseChartConfig<'violin'> {
  data: DistributionDataItem[];
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface VennDataItem {
  sets: string[] | string;
  value: number;
  label?: string;
}

export interface VennConfig extends BaseChartConfig<'venn'> {
  data: VennDataItem[];
}

export interface SankeyDataItem {
  source: string;
  target: string;
  value: number;
}

export interface SankeyConfig extends BaseChartConfig<'sankey'> {
  data: SankeyDataItem[];
  nodeAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface TreemapDataItem {
  name: string;
  value: number;
  children?: TreemapDataItem[];
}

export interface TreemapConfig extends BaseChartConfig<'treemap'> {
  data: TreemapDataItem[];
}

export interface WordCloudDataItem {
  text: string;
  value: number;
}

export interface WordCloudConfig extends BaseChartConfig<'word-cloud'> {
  data: WordCloudDataItem[];
  locale?: string;
}

export interface LiquidConfig extends BaseChartConfig<'liquid'> {
  percent: number;
  shape?: 'circle' | 'rect' | 'pin' | 'triangle';
}

export interface GraphData {
  nodes: Array<{ name: string }>;
  edges: Array<{ source: string; target: string; name?: string }>;
}

export interface FlowDiagramConfig extends BaseChartConfig<'flow-diagram'> {
  data: GraphData;
}

export interface NetworkGraphConfig extends BaseChartConfig<'network-graph'> {
  data: GraphData;
  layout?: 'force' | 'circular' | 'grid' | 'radial' | 'concentric' | 'dagre';
}

export interface TreeGraphData {
  name: string;
  description?: string;
  children?: TreeGraphData[];
}

export interface MindmapConfig extends BaseChartConfig<'mindmap'> {
  data: TreeGraphData;
  direction?: 'H' | 'LR' | 'RL';
}

export interface IndentedTreeConfig extends BaseChartConfig<'indented-tree'> {
  data: TreeGraphData;
  direction?: 'LR' | 'RL' | 'H';
}

export interface OrganizationChartConfig extends BaseChartConfig<'organization-chart'> {
  data: TreeGraphData;
}

export interface FishboneDiagramConfig extends BaseChartConfig<'fishbone-diagram'> {
  data: TreeGraphData;
}

export interface TableConfig extends BaseChartConfig<'table'> {
  data: Array<Record<string, unknown>>;
}

export interface SummaryObjectConfig extends BaseChartConfig<'summary'> {
  content: string;
}

export type SummaryConfig = string | SummaryObjectConfig;

export type GPTVisConfig =
  | AreaConfig
  | BarConfig
  | BoxplotConfig
  | ColumnConfig
  | DualAxesConfig
  | FishboneDiagramConfig
  | FlowDiagramConfig
  | FunnelConfig
  | HistogramConfig
  | IndentedTreeConfig
  | LineConfig
  | LiquidConfig
  | MindmapConfig
  | NetworkGraphConfig
  | OrganizationChartConfig
  | PieConfig
  | RadarConfig
  | SankeyConfig
  | ScatterConfig
  | SummaryObjectConfig
  | TableConfig
  | TreemapConfig
  | VennConfig
  | ViolinConfig
  | WaterfallConfig
  | WordCloudConfig;

export interface ChartHandle {
  render(config: VisualizationInput): void;
  resize(): void;
  destroy(): void;
  zoomTo(zoom: number): void;
  getZoom(): number;
}

export interface BoundGPTVis {
  update(content: VisualizationInput): void;
  resize(): void;
  destroy(): void;
}
