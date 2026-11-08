import type { ChartType } from '../types/charts.js';
import type { ResolvedTheme, ThemeStyle, VisualizationTheme } from '../types/theme.js';

export interface SeriesDescriptor {
  key: string;
  label: string;
  colorIndex: number;
}

export interface CartesianRow {
  category: string | number;
  [key: string]: string | number | null;
}

export interface BaseModel {
  type: ChartType;
  title?: string;
  subtitle?: string;
  theme: ResolvedTheme;
  style: ThemeStyle;
  axisXTitle?: string;
  axisYTitle?: string;
}

export interface LineModel extends BaseModel {
  type: 'line' | 'area';
  data: CartesianRow[];
  series: SeriesDescriptor[];
  stacked: boolean;
}

export interface BarModel extends BaseModel {
  type: 'column' | 'bar';
  data: CartesianRow[];
  series: SeriesDescriptor[];
  stacked: boolean;
  showLabels: boolean;
  layout: 'horizontal' | 'vertical';
  startAtZero: boolean;
}

export interface PieModel extends BaseModel {
  type: 'pie';
  data: Array<{ name: string; value: number; colorIndex: number }>;
  innerRadius: number;
}

export interface ScatterModel extends BaseModel {
  type: 'scatter';
  series: Array<{ name: string; points: Array<{ x: number; y: number }>; colorIndex: number }>;
}

export interface RadarModel extends BaseModel {
  type: 'radar';
  indicators: string[];
  series: Array<{
    name: string;
    values: number[];
    colorIndex: number;
  }>;
  align: boolean;
}

export interface FunnelModel extends BaseModel {
  type: 'funnel';
  data: Array<{ name: string; value: number; colorIndex: number }>;
  conversionRateLabel?: string;
}

export type WaterfallKind = 'positive' | 'negative' | 'total' | 'intermediate';

export interface WaterfallRow {
  category: string;
  start: number;
  end: number;
  base: number;
  size: number;
  value: number;
  kind: WaterfallKind;
}

export interface WaterfallModel extends BaseModel {
  type: 'waterfall';
  data: WaterfallRow[];
}

export interface DualAxesSeriesModel {
  key: string;
  label: string;
  type: 'line' | 'column';
  yAxisId: 'left' | 'right';
  colorIndex: number;
}

export interface DualAxesModel extends BaseModel {
  type: 'dual-axes';
  data: CartesianRow[];
  series: DualAxesSeriesModel[];
  leftAxisTitle?: string;
  rightAxisTitle?: string;
  startAtZero: boolean;
}

export interface HistogramBin {
  label: string;
  start: number;
  end: number;
  count: number;
}

export interface HistogramModel extends BaseModel {
  type: 'histogram';
  data: HistogramBin[];
  startAtZero: boolean;
}

export interface DistributionGroup {
  category: string;
  group: string;
  values: number[];
  q1: number;
  median: number;
  q3: number;
  low: number;
  high: number;
  outliers: number[];
  colorIndex: number;
  density: Array<{ value: number; density: number }>;
}

export interface DistributionModel extends BaseModel {
  type: 'boxplot' | 'violin';
  groups: DistributionGroup[];
  categories: string[];
  series: string[];
  startAtZero: boolean;
}

export interface VennModel extends BaseModel {
  type: 'venn';
  sets: string[];
  regions: Array<{ sets: string[]; value: number; label: string }>;
}

export interface SankeyNode {
  name: string;
  colorIndex: number;
}

export interface SankeyModel extends BaseModel {
  type: 'sankey';
  nodes: SankeyNode[];
  links: Array<{ source: number; target: number; value: number }>;
  nodeAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

export interface TreemapModel extends BaseModel {
  type: 'treemap';
  data: TreemapNode[];
}

export interface WordCloudModel extends BaseModel {
  type: 'word-cloud';
  data: Array<{ text: string; value: number }>;
}

export interface LiquidModel extends BaseModel {
  type: 'liquid';
  percent: number;
  shape: 'circle' | 'rect' | 'pin' | 'triangle';
}

export interface GraphNode {
  name: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  name?: string;
}

export interface GraphModel extends BaseModel {
  type: 'flow-diagram' | 'network-graph';
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: 'force' | 'circular' | 'grid' | 'radial' | 'concentric' | 'dagre';
}

export interface TreeNode {
  name: string;
  description?: string;
  children?: TreeNode[];
}

export interface TreeModel extends BaseModel {
  type: 'mindmap' | 'indented-tree' | 'organization-chart' | 'fishbone-diagram';
  root: TreeNode;
  direction: 'H' | 'LR' | 'RL';
}

export interface TableModel extends BaseModel {
  type: 'table';
  columns: string[];
  rows: Array<Record<string, string>>;
}

export interface SummaryModel extends BaseModel {
  type: 'summary';
  content: string;
}

export type ChartModel =
  | LineModel
  | BarModel
  | PieModel
  | ScatterModel
  | RadarModel
  | FunnelModel
  | WaterfallModel
  | DualAxesModel
  | HistogramModel
  | DistributionModel
  | VennModel
  | SankeyModel
  | TreemapModel
  | WordCloudModel
  | LiquidModel
  | GraphModel
  | TreeModel
  | TableModel
  | SummaryModel;

export interface ViewMeta {
  title?: string;
  subtitle?: string;
  locale: string;
}

export type VisView =
  | { kind: 'ready'; model: ChartModel; meta: ViewMeta }
  | { kind: 'pending'; meta: ViewMeta; message: string }
  | { kind: 'unsupported'; meta: ViewMeta; message: string }
  | { kind: 'error'; meta: ViewMeta; message: string };

export interface BuildContext {
  theme?: VisualizationTheme;
  streaming?: boolean;
  locale?: string;
}
