import { readConfig } from './parser.js';
import { GPTVis } from './runtime.js';
import type { ChartHandle, VisualizationInput } from './types/charts.js';
import type { VisualizationOptions } from './types/theme.js';

export type ChartFactory = (options: VisualizationOptions) => ChartHandle;

function withType(input: VisualizationInput, type: string): Record<string, unknown> {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return { type };
    const config = readConfig(input);
    if (type === 'summary' && !config.type && trimmed) {
      return { type, content: input };
    }
    return { ...config, type };
  }
  return { ...(input as Record<string, unknown>), type };
}

function defineChart(type: string): ChartFactory {
  return (options) => {
    const vis = new GPTVis(options);
    return {
      render: (input) => vis.render(withType(input, type)),
      resize: () => vis.resize(),
      destroy: () => vis.destroy(),
      zoomTo: (zoom) => vis.zoomTo(zoom),
      getZoom: () => vis.getZoom(),
    };
  };
}

export const Line = defineChart('line');
export const Area = defineChart('area');
export const Column = defineChart('column');
export const Bar = defineChart('bar');
export const Pie = defineChart('pie');
export const Scatter = defineChart('scatter');
export const Radar = defineChart('radar');
export const Funnel = defineChart('funnel');
export const Waterfall = defineChart('waterfall');
export const DualAxes = defineChart('dual-axes');
export const Histogram = defineChart('histogram');
export const Boxplot = defineChart('boxplot');
export const Violin = defineChart('violin');
export const Venn = defineChart('venn');
export const Sankey = defineChart('sankey');
export const Treemap = defineChart('treemap');
export const WordCloud = defineChart('word-cloud');
export const Liquid = defineChart('liquid');
export const FlowDiagram = defineChart('flow-diagram');
export const NetworkGraph = defineChart('network-graph');
export const Mindmap = defineChart('mindmap');
export const IndentedTree = defineChart('indented-tree');
export const OrganizationChart = defineChart('organization-chart');
export const FishboneDiagram = defineChart('fishbone-diagram');
export const Table = defineChart('table');
export const Summary = defineChart('summary');
