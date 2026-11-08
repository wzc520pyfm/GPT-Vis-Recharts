import type { ThemeStyle, VisualizationTheme } from '../types/theme.js';
import { resolveChartTheme } from '../theme/resolve.js';
import type { BaseModel, SeriesDescriptor, ViewMeta } from './types.js';

export const LIMITS = {
  rows: 10_000,
  nodes: 250,
  edges: 1_000,
  words: 50,
  treeDepth: 20,
  series: 20,
  title: 500,
  label: 2_000,
  summary: 50_000,
} as const;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.slice(0, LIMITS.label);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

export function asFinite(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function cleanTitle(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.trim().slice(0, LIMITS.title);
}

export function cleanStyle(value: unknown): ThemeStyle {
  return asRecord(value) as ThemeStyle;
}

export function assertRows(value: unknown, name = 'data'): unknown[] {
  const rows = asArray(value);
  if (rows.length > LIMITS.rows) {
    throw new ValidationError(`${name} exceeds the ${LIMITS.rows} row limit`);
  }
  return rows;
}

export function assertSeries(count: number): void {
  if (count > LIMITS.series) {
    throw new ValidationError(`series exceeds the ${LIMITS.series} group limit`);
  }
}

export function makeBase(
  type: BaseModel['type'],
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
  axisXTitle?: string,
  axisYTitle?: string,
): BaseModel {
  const style = cleanStyle(config.style);
  return {
    type,
    title: cleanTitle(config.title),
    subtitle: cleanTitle(config.subtitle),
    theme: resolveChartTheme(config.theme ?? theme, type, style),
    style,
    axisXTitle: asString(axisXTitle ?? config.axisXTitle).trim() || undefined,
    axisYTitle: asString(axisYTitle ?? config.axisYTitle).trim() || undefined,
  };
}

export function makeMeta(config: Record<string, unknown>, locale = 'en-US'): ViewMeta {
  return {
    title: cleanTitle(config.title),
    subtitle: cleanTitle(config.subtitle),
    locale,
  };
}

export function buildSeries(labels: string[]): SeriesDescriptor[] {
  assertSeries(labels.length);
  return labels.map((label, index) => ({
    key: `series_${index}`,
    label,
    colorIndex: index,
  }));
}

export function paletteColor(palette: string[], index: number): string {
  return palette[index % Math.max(1, palette.length)] ?? '#5b6cff';
}
