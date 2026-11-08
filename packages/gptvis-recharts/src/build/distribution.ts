import type { VisualizationTheme } from '../types/theme.js';
import type { DistributionGroup, DistributionModel } from './types.js';
import {
  asArray,
  asFinite,
  asRecord,
  asString,
  assertRows,
  makeBase,
} from './shared.js';

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0] ?? 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const lowerValue = sorted[lower] ?? 0;
  const upperValue = sorted[upper] ?? lowerValue;
  return lowerValue + (upperValue - lowerValue) * (position - lower);
}

function density(values: number[]): Array<{ value: number; density: number }> {
  if (values.length < 2) {
    const single = values[0] ?? 0;
    return [
      { value: single - 1, density: 0 },
      { value: single, density: 1 },
      { value: single + 1, density: 0 },
    ];
  }
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? min;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1);
  const standardDeviation = Math.sqrt(variance);
  const bandwidth = Math.max(
    (1.06 * standardDeviation) / Math.cbrt(values.length),
    (max - min) / 100,
    0.000001,
  );
  const span = Math.max(max - min, bandwidth * 2);
  const start = min - bandwidth * 0.5;
  const end = max + bandwidth * 0.5;
  const samples = Array.from({ length: Math.max(32, Math.min(96, values.length * 3)) }, (_, index) => {
    const ratio = index / Math.max(1, Math.min(96, Math.max(31, values.length * 3)) - 1);
    return start + ratio * (end - start);
  });
  const densityValues = samples.map((sample) => {
    const scale = 1 / (values.length * bandwidth * Math.sqrt(2 * Math.PI));
    const sum = values.reduce((total, value) => {
      const z = (sample - value) / bandwidth;
      return total + Math.exp(-0.5 * z * z);
    }, 0);
    return { value: sample, density: sum * scale };
  });
  const maxDensity = Math.max(...densityValues.map((item) => item.density), 0.000001);
  return densityValues.map((item) => ({
    value: item.value,
    density: item.density / maxDensity,
  }));
}

export function normalizeDistribution(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): DistributionModel {
  const type = config.type === 'violin' ? 'violin' : 'boxplot';
  const rows = assertRows(config.data);
  const grouped = new Map<string, { category: string; group: string; values: number[] }>();
  const categories: string[] = [];
  const series: string[] = [];
  const categorySeen = new Set<string>();
  const seriesSeen = new Set<string>();

  for (const row of rows) {
    const record = asRecord(row);
    const category = asString(record.category);
    const value = asFinite(record.value);
    if (!category || value === undefined) continue;
    const group = asString(record.group).trim() || 'Value';
    if (!categorySeen.has(category)) {
      categorySeen.add(category);
      categories.push(category);
    }
    if (!seriesSeen.has(group)) {
      seriesSeen.add(group);
      series.push(group);
    }
    const key = `${category}\u0000${group}`;
    const item = grouped.get(key) ?? { category, group, values: [] };
    item.values.push(value);
    grouped.set(key, item);
  }

  const groups: DistributionGroup[] = [];
  for (const item of grouped.values()) {
    const values = [...item.values].sort((a, b) => a - b);
    const q1 = quantile(values, 0.25);
    const median = quantile(values, 0.5);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowFence = q1 - iqr * 1.5;
    const highFence = q3 + iqr * 1.5;
    const inliers = values.filter((value) => value >= lowFence && value <= highFence);
    groups.push({
      category: item.category,
      group: item.group,
      values,
      q1,
      median,
      q3,
      low: inliers[0] ?? values[0] ?? q1,
      high: inliers[inliers.length - 1] ?? values[values.length - 1] ?? q3,
      outliers: values.filter((value) => value < lowFence || value > highFence),
      colorIndex: series.indexOf(item.group),
      density: density(values),
    });
  }

  const base = makeBase(type, config, theme);
  return {
    ...base,
    type,
    groups,
    categories,
    series,
    startAtZero: Boolean(base.style.startAtZero),
  };
}

export function extractDistributionValues(value: unknown): number[] {
  return asArray(value)
    .map(asFinite)
    .filter((item): item is number => item !== undefined);
}
