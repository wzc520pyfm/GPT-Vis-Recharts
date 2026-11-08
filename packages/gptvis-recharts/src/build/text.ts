import type { VisualizationTheme } from '../types/theme.js';
import type {
  LiquidModel,
  SummaryModel,
  TableModel,
  VennModel,
  WordCloudModel,
} from './types.js';
import {
  asArray,
  asFinite,
  asRecord,
  asString,
  assertRows,
  LIMITS,
  makeBase,
  ValidationError,
} from './shared.js';

function parseSets(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => asString(item).trim()).filter(Boolean))];
  }
  return [
    ...new Set(
      asString(value)
        .split(/[,，\s]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function normalizeVenn(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): VennModel {
  const rows = assertRows(config.data);
  const sets: string[] = [];
  const setSeen = new Set<string>();
  const regionMap = new Map<string, { sets: string[]; value: number; label: string }>();

  for (const row of rows) {
    const record = asRecord(row);
    const regionSets = parseSets(record.sets);
    const value = asFinite(record.value);
    if (!regionSets.length || regionSets.length > 3 || value === undefined || value < 0) continue;
    for (const set of regionSets) {
      if (!setSeen.has(set)) {
        setSeen.add(set);
        sets.push(set);
      }
    }
    const ordered = [...regionSets].sort();
    const key = ordered.join('\u0000');
    const existing = regionMap.get(key);
    const label =
      asString(record.label).trim() ||
      (regionSets.length === 1 ? regionSets[0] ?? '' : regionSets.join(' ∩ '));
    if (existing) {
      existing.value += value;
    } else {
      regionMap.set(key, { sets: regionSets, value, label });
    }
  }

  if (sets.length > 3) throw new ValidationError('venn supports at most three sets');
  return {
    ...makeBase('venn', config, theme),
    type: 'venn',
    sets,
    regions: [...regionMap.values()],
  };
}

export function normalizeWordCloud(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): WordCloudModel {
  const aggregated = new Map<string, number>();
  for (const row of assertRows(config.data)) {
    const record = asRecord(row);
    const text = asString(record.text).trim();
    const value = asFinite(record.value);
    if (!text || value === undefined || value <= 0) continue;
    aggregated.set(text, (aggregated.get(text) ?? 0) + value);
  }
  const data = [...aggregated.entries()]
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value || a.text.localeCompare(b.text))
    .slice(0, LIMITS.words);
  return {
    ...makeBase('word-cloud', config, theme),
    type: 'word-cloud',
    data,
  };
}

export function normalizeLiquid(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): LiquidModel {
  const percent = Math.max(0, Math.min(1, asFinite(config.percent) ?? 0));
  const shapes = ['circle', 'rect', 'pin', 'triangle'] as const;
  const requested = config.shape;
  const shape = shapes.find((item) => item === requested) ?? 'circle';
  return {
    ...makeBase('liquid', config, theme),
    type: 'liquid',
    percent,
    shape,
  };
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.slice(0, LIMITS.label);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(stringifyCell).join(', ').slice(0, LIMITS.label);
  }
  try {
    return JSON.stringify(value).slice(0, LIMITS.label);
  } catch {
    return String(value).slice(0, LIMITS.label);
  }
}

export function normalizeTable(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): TableModel {
  const records = assertRows(config.data).filter(
    (row) => row !== null && typeof row === 'object' && !Array.isArray(row),
  );
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of records) {
    for (const key of Object.keys(row as Record<string, unknown>)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  const rows = records.map((row) => {
    const record = row as Record<string, unknown>;
    const output: Record<string, string> = {};
    for (const column of columns) {
      Object.defineProperty(output, column, {
        value: Object.prototype.hasOwnProperty.call(record, column)
          ? stringifyCell(record[column])
          : '',
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return output;
  });
  return {
    ...makeBase('table', config, theme),
    type: 'table',
    columns,
    rows,
  };
}

export function normalizeSummary(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): SummaryModel {
  const content =
    typeof config.content === 'string'
      ? config.content.slice(0, LIMITS.summary)
      : asString(config.content).slice(0, LIMITS.summary);
  if (!content.trim()) throw new ValidationError('summary content is required');
  return {
    ...makeBase('summary', config, theme),
    type: 'summary',
    content,
  };
}
