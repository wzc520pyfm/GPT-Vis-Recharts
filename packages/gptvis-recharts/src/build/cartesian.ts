import type { VisualizationTheme } from '../types/theme.js';
import type {
  BarModel,
  CartesianRow,
  DualAxesModel,
  FunnelModel,
  HistogramBin,
  HistogramModel,
  LineModel,
  PieModel,
  RadarModel,
  ScatterModel,
  WaterfallModel,
  WaterfallRow,
} from './types.js';
import {
  asArray,
  asBoolean,
  asFinite,
  asRecord,
  asString,
  assertRows,
  buildSeries,
  makeBase,
  ValidationError,
} from './shared.js';

interface Observation {
  category: string;
  value: number;
  group: string;
}

function observations(
  value: unknown,
  categoryKey: string,
  preserveNumericCategory = false,
): Observation[] {
  const rows = assertRows(value);
  const result: Observation[] = [];
  for (const row of rows) {
    const record = asRecord(row);
    const numericCategory = asFinite(record[categoryKey]);
    const category =
      preserveNumericCategory && numericCategory !== undefined
        ? String(numericCategory)
        : asString(record[categoryKey]);
    const numeric = asFinite(record.value);
    if (!category || numeric === undefined) continue;
    result.push({
      category,
      value: numeric,
      group: asString(record.group).trim(),
    });
  }
  return result;
}

function pivot(rows: Observation[]): {
  data: CartesianRow[];
  series: string[];
} {
  const categories: string[] = [];
  const groups: string[] = [];
  const categoriesSeen = new Set<string>();
  const groupsSeen = new Set<string>();
  const values = new Map<string, Map<string, number>>();

  for (const row of rows) {
    if (!categoriesSeen.has(row.category)) {
      categoriesSeen.add(row.category);
      categories.push(row.category);
    }
    if (!groupsSeen.has(row.group)) {
      groupsSeen.add(row.group);
      groups.push(row.group);
    }
    let category = values.get(row.category);
    if (!category) {
      category = new Map();
      values.set(row.category, category);
    }
    category.set(row.group, (category.get(row.group) ?? 0) + row.value);
  }

  const descriptors = buildSeries(groups.map((group) => group || 'Value'));
  const data = categories.map((category) => {
    const result: CartesianRow = { category };
    const groupValues = values.get(category);
    for (const descriptor of descriptors) {
      const label = groups[descriptor.colorIndex] ?? '';
      result[descriptor.key] = groupValues?.get(label) ?? null;
    }
    return result;
  });

  return { data, series: groups };
}

export function normalizeLine(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): LineModel {
  const type = config.type === 'area' ? 'area' : 'line';
  const rows = observations(config.data, 'time', true);
  const { data, series } = pivot(rows);
  const base = makeBase(type, config, theme);
  return {
    ...base,
    type,
    data,
    series: buildSeries(series.map((group) => group || base.axisYTitle || 'Value')),
    stacked: type === 'area' && asBoolean(config.stack),
  };
}

export const normalizeArea = normalizeLine;

export function normalizeBar(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): BarModel {
  const type = config.type === 'bar' ? 'bar' : 'column';
  const rows = observations(config.data, 'category');
  const { data, series } = pivot(rows);
  const base = makeBase(type, config, theme);
  const horizontal = type === 'bar';
  return {
    ...base,
    type,
    data,
    series: buildSeries(series.map((group) => group || base.axisYTitle || 'Value')),
    stacked: asBoolean(config.stack),
    showLabels: asBoolean(config.label, true),
    layout: horizontal ? 'vertical' : 'horizontal',
    startAtZero: Boolean(base.style.startAtZero),
  };
}

export const normalizeColumn = normalizeBar;

export function normalizePie(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): PieModel {
  const rows = assertRows(config.data);
  const data = rows
    .map((row, index) => {
      const record = asRecord(row);
      const name = asString(record.category);
      const value = asFinite(record.value);
      return name && value !== undefined && value >= 0
        ? { name, value, colorIndex: index }
        : null;
    })
    .filter((item): item is { name: string; value: number; colorIndex: number } => item !== null);

  const innerRadius = Math.max(0, Math.min(1, asFinite(config.innerRadius) ?? 0));
  return {
    ...makeBase('pie', config, theme),
    type: 'pie',
    data,
    innerRadius,
  };
}

export function normalizeScatter(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): ScatterModel {
  const rows = assertRows(config.data);
  const groups = new Map<string, Array<{ x: number; y: number }>>();
  for (const row of rows) {
    const record = asRecord(row);
    const x = asFinite(record.x);
    const y = asFinite(record.y);
    if (x === undefined || y === undefined) continue;
    const group = asString(record.group) || 'Value';
    const points = groups.get(group) ?? [];
    points.push({ x, y });
    groups.set(group, points);
  }
  return {
    ...makeBase('scatter', config, theme),
    type: 'scatter',
    series: [...groups.entries()].map(([name, points], index) => ({
      name,
      points,
      colorIndex: index,
    })),
  };
}

export function normalizeRadar(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): RadarModel {
  const rows = assertRows(config.data);
  const indicators: string[] = [];
  const indicatorSeen = new Set<string>();
  const groups = new Map<string, Map<string, number>>();
  const groupOrder: string[] = [];

  for (const row of rows) {
    const record = asRecord(row);
    const name = asString(record.name);
    const value = asFinite(record.value);
    if (!name || value === undefined) continue;
    if (!indicatorSeen.has(name)) {
      indicatorSeen.add(name);
      indicators.push(name);
    }
    const group = asString(record.group) || 'Value';
    if (!groups.has(group)) {
      groups.set(group, new Map());
      groupOrder.push(group);
    }
    groups.get(group)?.set(name, value);
  }

  return {
    ...makeBase('radar', config, theme),
    type: 'radar',
    indicators,
    series: groupOrder.map((name, index) => ({
      name,
      values: indicators.map((indicator) => groups.get(name)?.get(indicator) ?? 0),
      colorIndex: index,
    })),
    align: asBoolean(config.align),
  };
}

export function normalizeFunnel(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): FunnelModel {
  const data = assertRows(config.data)
    .map((row, index) => {
      const record = asRecord(row);
      const name = asString(record.category);
      const value = asFinite(record.value);
      return name && value !== undefined && value >= 0
        ? { name, value, colorIndex: index }
        : null;
    })
    .filter((item): item is { name: string; value: number; colorIndex: number } => item !== null);

  return {
    ...makeBase('funnel', config, theme),
    type: 'funnel',
    data,
    conversionRateLabel: asString(config.conversionRateLabel).trim() || undefined,
  };
}

export function normalizeWaterfall(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): WaterfallModel {
  const rows = assertRows(config.data);
  const data: WaterfallRow[] = [];
  let running = 0;

  for (const row of rows) {
    const record = asRecord(row);
    const category = asString(record.category);
    if (!category) continue;
    const supplied = asFinite(record.value);
    const isTotal = asBoolean(record.isTotal);
    const isIntermediate = asBoolean(record.isIntermediateTotal);

    if (isTotal) {
      const end = supplied ?? running;
      data.push({
        category,
        start: 0,
        end,
        base: 0,
        size: Math.abs(end),
        value: end,
        kind: 'total',
      });
      running = end;
      continue;
    }
    if (isIntermediate) {
      data.push({
        category,
        start: 0,
        end: running,
        base: 0,
        size: Math.abs(running),
        value: running,
        kind: 'intermediate',
      });
      continue;
    }
    if (supplied === undefined) continue;
    const start = running;
    const end = running + supplied;
    data.push({
      category,
      start,
      end,
      base: Math.min(start, end),
      size: Math.abs(supplied),
      value: supplied,
      kind: supplied < 0 ? 'negative' : 'positive',
    });
    running = end;
  }

  return {
    ...makeBase('waterfall', config, theme),
    type: 'waterfall',
    data,
  };
}

export function normalizeDualAxes(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): DualAxesModel {
  const categories = asArray(config.categories)
    .slice(0, 10_000)
    .map((value) => asString(value))
    .filter(Boolean);
  const seriesInput = asArray(config.series);
  if (seriesInput.length > 20) throw new ValidationError('series exceeds the 20 group limit');

  const data: CartesianRow[] = categories.map((category) => ({ category }));
  const series: DualAxesModel['series'] = [];

  seriesInput.forEach((item, index) => {
    const record = asRecord(item);
    const kind = record.type === 'column' ? 'column' : 'line';
    const values = asArray(record.data);
    const key = `series_${index}`;
    const yAxisId = index === 0 ? 'left' : index === 1 ? 'right' : index % 2 === 0 ? 'left' : 'right';
    const label =
      asString(record.axisYTitle) ||
      asString(record.name) ||
      (kind === 'column' ? `Series ${index + 1}` : `Series ${index + 1}`);
    series.push({
      key,
      label,
      type: kind,
      yAxisId,
      colorIndex: index,
    });
    for (let rowIndex = 0; rowIndex < data.length; rowIndex += 1) {
      const row = data[rowIndex];
      if (row) row[key] = asFinite(values[rowIndex]) ?? null;
    }
  });

  const leftAxisTitle = asString(asRecord(seriesInput[0]).axisYTitle).trim() || undefined;
  const rightAxisTitle = asString(asRecord(seriesInput[1]).axisYTitle).trim() || undefined;
  return {
    ...makeBase('dual-axes', config, theme),
    type: 'dual-axes',
    data,
    series,
    leftAxisTitle,
    rightAxisTitle,
    startAtZero: Boolean(makeBase('dual-axes', config, theme).style.startAtZero),
  };
}

export function normalizeHistogram(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): HistogramModel {
  const values = asArray(config.data)
    .slice(0, 10_000)
    .map(asFinite)
    .filter((value): value is number => value !== undefined);
  const requested = asFinite(config.binNumber);
  const binCount = Math.max(
    1,
    Math.min(50, Math.floor(requested ?? Math.max(3, Math.ceil(Math.sqrt(Math.max(1, values.length)))))),
  );

  if (!values.length) {
    return {
      ...makeBase('histogram', config, theme),
      type: 'histogram',
      data: [],
      startAtZero: Boolean(makeBase('histogram', config, theme).style.startAtZero),
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = max === min ? 1 : (max - min) / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, index) => {
    const start = min + width * index;
    const end = index === binCount - 1 ? max : start + width;
    return {
      label: `${formatNumber(start)}–${formatNumber(end)}`,
      start,
      end,
      count: 0,
    };
  });
  for (const value of values) {
    const index = max === min ? 0 : Math.min(binCount - 1, Math.floor((value - min) / width));
    const bin = bins[index];
    if (bin) bin.count += 1;
  }

  return {
    ...makeBase('histogram', config, theme),
    type: 'histogram',
    data: bins,
    startAtZero: Boolean(makeBase('histogram', config, theme).style.startAtZero),
  };
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return String(Number(value.toFixed(3)));
}
