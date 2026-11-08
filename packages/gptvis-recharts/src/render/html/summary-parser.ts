export const SUMMARY_ENTITY_TYPES = [
  'metric_name',
  'metric_value',
  'other_metric_value',
  'delta_value',
  'ratio_value',
  'contribute_ratio',
  'proportion',
  'trend_desc',
  'dim_value',
  'time_desc',
  'rank',
  'difference',
  'anomaly',
  'association',
  'distribution',
  'seasonality',
] as const;

export type SummaryEntityType = (typeof SUMMARY_ENTITY_TYPES)[number];
export type SummaryAssessment = 'positive' | 'negative' | 'equal';
export type SummaryDetail =
  | number[]
  | Array<{ x: number; y: number }>
  | { data: number[]; range?: [number, number] };

export interface SummaryEntity {
  kind: 'entity';
  text: string;
  entityType: SummaryEntityType;
  origin?: number;
  assessment?: SummaryAssessment;
  unit?: string;
  detail?: SummaryDetail;
}

export interface SummaryText {
  kind: 'text';
  text: string;
}

export interface SummaryStrong {
  kind: 'strong';
  children: SummaryInline[];
}

export interface SummaryCode {
  kind: 'code';
  text: string;
}

export type SummaryInline = SummaryText | SummaryStrong | SummaryCode | SummaryEntity;

export interface SummaryHeadingBlock {
  kind: 'heading';
  level: number;
  inlines: SummaryInline[];
}

export interface SummaryParagraphBlock {
  kind: 'paragraph';
  inlines: SummaryInline[];
}

export interface SummaryListBlock {
  kind: 'list';
  ordered: boolean;
  items: SummaryInline[][];
}

export interface SummaryCodeBlock {
  kind: 'code';
  code: string;
}

export type SummaryBlock =
  | SummaryHeadingBlock
  | SummaryParagraphBlock
  | SummaryListBlock
  | SummaryCodeBlock;

const ENTITY_SET = new Set<string>(SUMMARY_ENTITY_TYPES);
const INLINE_ENTITY_TYPES = new Set<SummaryEntityType>(SUMMARY_ENTITY_TYPES);
const MAX_INLINE_TEXT = 2_000;
const MAX_ENTITY_TARGET = 8_000;

function isEntityType(value: string): value is SummaryEntityType {
  return ENTITY_SET.has(value);
}

function pushText(nodes: SummaryInline[], text: string): void {
  if (!text) return;
  const previous = nodes[nodes.length - 1];
  if (previous?.kind === 'text') {
    previous.text = `${previous.text}${text}`.slice(0, MAX_INLINE_TEXT);
  } else {
    nodes.push({ kind: 'text', text: text.slice(0, MAX_INLINE_TEXT) });
  }
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index] ?? '';
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote && character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"' || character === "'") {
      if (quote === character) quote = '';
      else if (!quote) quote = character;
      continue;
    }
    if (quote) continue;
    if (character === '[' || character === '{' || character === '(') depth += 1;
    else if (character === ']' || character === '}' || character === ')') depth = Math.max(0, depth - 1);
    else if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    if ((first === '"' || first === "'") && trimmed.endsWith(first)) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function setOwn(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

function parseAttributeValue(value: string): unknown {
  const raw = value.trim();
  if (!raw) return '';
  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return unquote(raw);
    }
  }
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) {
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return unquote(raw);
}

function finiteArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    .slice(0, 64);
}

function normalizeDetail(value: unknown): SummaryDetail | undefined {
  if (Array.isArray(value)) {
    const numbers = finiteArray(value);
    if (numbers.length === value.length && numbers.length > 1) return numbers;
    const points = value
      .filter(
        (item): item is { x: number; y: number } =>
          Boolean(item) &&
          typeof item === 'object' &&
          Number.isFinite((item as { x?: unknown }).x) &&
          Number.isFinite((item as { y?: unknown }).y),
      )
      .slice(0, 64);
    if (points.length > 1) {
      return points.map((point) => ({ x: point.x, y: point.y }));
    }
    return undefined;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const data = finiteArray(record.data);
    if (!data.length) return undefined;
    const range = finiteArray(record.range);
    return range.length === 2
      ? { data, range: [range[0] ?? 0, range[1] ?? 0] }
      : { data };
  }
  return undefined;
}

function parseEntity(text: string, target: string): SummaryEntity | null {
  if (!text || target.length > MAX_ENTITY_TARGET) return null;
  const parts = splitTopLevel(target);
  const entityType = parts[0] ?? '';
  if (!isEntityType(entityType)) return null;

  const attributes: Record<string, unknown> = {};
  for (const part of parts.slice(1)) {
    const separator = part.indexOf('=');
    if (separator <= 0) continue;
    const key = part.slice(0, separator).trim();
    setOwn(attributes, key, parseAttributeValue(part.slice(separator + 1)));
  }

  const origin =
    typeof attributes.origin === 'number' && Number.isFinite(attributes.origin)
      ? attributes.origin
      : undefined;
  const assessment =
    attributes.assessment === 'positive' ||
    attributes.assessment === 'negative' ||
    attributes.assessment === 'equal'
      ? attributes.assessment
      : undefined;
  const unit =
    typeof attributes.unit === 'string' && attributes.unit.trim()
      ? attributes.unit.trim().slice(0, 80)
      : undefined;
  const detail = normalizeDetail(attributes.detail);

  return {
    kind: 'entity',
    text: text.slice(0, MAX_INLINE_TEXT),
    entityType: INLINE_ENTITY_TYPES.has(entityType) ? entityType : 'metric_name',
    ...(origin === undefined ? {} : { origin }),
    ...(assessment === undefined ? {} : { assessment }),
    ...(unit === undefined ? {} : { unit }),
    ...(detail === undefined ? {} : { detail }),
  };
}

function findClosingParenthesis(value: string, start: number): number {
  let quote = '';
  let escaped = false;
  let depth = 0;
  for (let index = start; index < value.length; index += 1) {
    const character = value[index] ?? '';
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote && character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"' || character === "'") {
      if (quote === character) quote = '';
      else if (!quote) quote = character;
      continue;
    }
    if (quote) continue;
    if (character === '[' || character === '{') depth += 1;
    else if (character === ']' || character === '}') depth = Math.max(0, depth - 1);
    else if (character === ')' && depth === 0) return index;
  }
  return -1;
}

function tryEntity(value: string, start: number): { entity: SummaryEntity; end: number } | null {
  if (value[start] !== '[') return null;
  const labelEnd = value.indexOf('](', start + 1);
  if (labelEnd < 0 || labelEnd - start > MAX_INLINE_TEXT) return null;
  const targetStart = labelEnd + 2;
  const end = findClosingParenthesis(value, targetStart);
  if (end < 0) return null;
  const entity = parseEntity(value.slice(start + 1, labelEnd), value.slice(targetStart, end));
  return entity ? { entity, end: end + 1 } : null;
}

export function parseSummaryInline(value: string): SummaryInline[] {
  const nodes: SummaryInline[] = [];
  let index = 0;
  let buffer = '';
  const flush = () => {
    pushText(nodes, buffer);
    buffer = '';
  };

  while (index < value.length) {
    if (value.startsWith('**', index)) {
      const end = value.indexOf('**', index + 2);
      if (end > index + 2) {
        flush();
        nodes.push({
          kind: 'strong',
          children: parseSummaryInline(value.slice(index + 2, end)),
        });
        index = end + 2;
        continue;
      }
    }
    if (value[index] === '`') {
      const end = value.indexOf('`', index + 1);
      if (end > index + 1) {
        flush();
        nodes.push({ kind: 'code', text: value.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }
    if (value[index] === '[') {
      const parsed = tryEntity(value, index);
      if (parsed) {
        flush();
        nodes.push(parsed.entity);
        index = parsed.end;
        continue;
      }
    }
    buffer += value[index] ?? '';
    index += 1;
  }
  flush();
  return nodes;
}

export function parseSummary(content: string): SummaryBlock[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: SummaryBlock[] = [];
  let paragraph: string[] = [];
  let list: SummaryListBlock | null = null;
  let code: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({
      kind: 'paragraph',
      inlines: parseSummaryInline(paragraph.join('\n')),
    });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (code) {
        blocks.push({ kind: 'code', code: code.join('\n') });
        code = null;
      } else {
        flushParagraph();
        flushList();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: 'heading',
        level: heading[1]?.length ?? 1,
        inlines: parseSummaryInline(heading[2] ?? ''),
      });
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const orderedList = Boolean(ordered);
      if (!list || list.ordered !== orderedList) {
        flushList();
        list = { kind: 'list', ordered: orderedList, items: [] };
      }
      list.items.push(parseSummaryInline((unordered?.[1] ?? ordered?.[1]) ?? ''));
      continue;
    }
    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  if (code) blocks.push({ kind: 'code', code: code.join('\n') });
  return blocks.length
    ? blocks
    : content.trim()
      ? [{ kind: 'paragraph', inlines: parseSummaryInline(content.trim()) }]
      : [];
}
