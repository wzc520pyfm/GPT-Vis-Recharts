import { SUPPORTED, chartLabel } from '../catalog.js';
import { readConfig } from '../parser.js';
import type { VisualizationTheme } from '../types/theme.js';
import {
  normalizeArea,
  normalizeBar,
  normalizeDualAxes,
  normalizeFunnel,
  normalizeHistogram,
  normalizeLine,
  normalizePie,
  normalizeRadar,
  normalizeScatter,
  normalizeWaterfall,
  normalizeColumn,
} from './cartesian.js';
import { normalizeDistribution } from './distribution.js';
import { normalizeGraph, normalizeSankey, normalizeTree, normalizeTreemap } from './hierarchy.js';
import {
  normalizeLiquid,
  normalizeSummary,
  normalizeTable,
  normalizeVenn,
  normalizeWordCloud,
} from './text.js';
import type { BuildContext, ChartModel, VisView } from './types.js';
import { asArray, asRecord, makeMeta, ValidationError } from './shared.js';

const MESSAGES = {
  'en-US': {
    pending: 'Waiting for more chart data…',
    empty: 'No usable data to render.',
    unsupported: (type: string) => `Unsupported chart type: ${type || '(missing)'}.`,
    error: 'The chart could not be rendered.',
  },
  'zh-CN': {
    pending: '正在等待更多图表数据…',
    empty: '暂无可渲染的数据。',
    unsupported: (type: string) => `不支持的图表类型：${type || '（缺失）'}。`,
    error: '图表渲染失败。',
  },
};

function localeKey(locale: string) {
  return locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

function hasData(config: Record<string, unknown>): boolean {
  if (typeof config.content === 'string' && config.content.trim()) return true;
  if (typeof config.percent === 'number' && Number.isFinite(config.percent)) return true;
  if (Array.isArray(config.data)) return config.data.length > 0;
  const data = asRecord(config.data);
  return asArray(data.nodes).length > 0 || asArray(data.links).length > 0;
}

export function buildView(
  input: string | object,
  context: BuildContext = {},
): VisView {
  const locale = context.locale ?? 'en-US';
  const messages = MESSAGES[localeKey(locale)];
  const config = readConfig(input, { streaming: context.streaming });
  const meta = makeMeta(config, locale);
  const type = config.type;

  if (!type) {
    if (context.streaming) {
      return { kind: 'pending', meta, message: messages.pending };
    }
    return { kind: 'error', meta, message: messages.unsupported('') };
  }

  if (!SUPPORTED.has(type)) {
    return { kind: 'unsupported', meta, message: messages.unsupported(type) };
  }

  if (context.streaming && !hasData(config)) {
    return { kind: 'pending', meta, message: messages.pending };
  }

  try {
    const model = normalizeChart(type, config, context.theme);
    return { kind: 'ready', model, meta };
  } catch (error) {
    const message =
      error instanceof ValidationError ? error.message : messages.error;
    return { kind: 'error', meta, message };
  }
}

function normalizeChart(
  type: string,
  config: Record<string, unknown>,
  theme?: VisualizationTheme,
): ChartModel {
  switch (type) {
    case 'line':
      return normalizeLine(config, theme);
    case 'area':
      return normalizeArea(config, theme);
    case 'column':
      return normalizeColumn(config, theme);
    case 'bar':
      return normalizeBar(config, theme);
    case 'pie':
      return normalizePie(config, theme);
    case 'scatter':
      return normalizeScatter(config, theme);
    case 'radar':
      return normalizeRadar(config, theme);
    case 'funnel':
      return normalizeFunnel(config, theme);
    case 'waterfall':
      return normalizeWaterfall(config, theme);
    case 'dual-axes':
      return normalizeDualAxes(config, theme);
    case 'histogram':
      return normalizeHistogram(config, theme);
    case 'boxplot':
    case 'violin':
      return normalizeDistribution(config, theme);
    case 'venn':
      return normalizeVenn(config, theme);
    case 'sankey':
      return normalizeSankey(config, theme);
    case 'treemap':
      return normalizeTreemap(config, theme);
    case 'word-cloud':
      return normalizeWordCloud(config, theme);
    case 'liquid':
      return normalizeLiquid(config, theme);
    case 'flow-diagram':
    case 'network-graph':
      return normalizeGraph(config, theme, type);
    case 'mindmap':
    case 'indented-tree':
    case 'organization-chart':
    case 'fishbone-diagram':
      return normalizeTree(config, theme, type);
    case 'table':
      return normalizeTable(config, theme);
    case 'summary':
      return normalizeSummary(config, theme);
    default:
      throw new ValidationError(messagesUnsupported(type));
  }
}

function messagesUnsupported(type: string): string {
  return `Unsupported chart type: ${chartLabel(type) || type}`;
}

export type {
  BarModel,
  ChartModel,
  DistributionModel,
  DualAxesModel,
  FunnelModel,
  GraphModel,
  HistogramModel,
  LineModel,
  PieModel,
  RadarModel,
  SankeyModel,
  ScatterModel,
  SummaryModel,
  TableModel,
  TreeModel,
  TreemapModel,
  VennModel,
  VisView,
  WaterfallModel,
  WordCloudModel,
} from './types.js';

export type { BuildContext } from './types.js';
