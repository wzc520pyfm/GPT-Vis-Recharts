export interface ParsedConfig {
  type: string;
  [key: string]: unknown;
}

export interface ParseOptions {
  streaming?: boolean;
}

const ARRAY_SECTIONS = new Set(['data', 'categories', 'series', 'children', 'nodes', 'edges']);
const OBJECT_SECTIONS = new Set(['style']);

interface Line {
  text: string;
  indent: number;
}

function setOwn(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export function isVisSyntax(input: unknown): input is string {
  return typeof input === 'string' && /^vis(?:\s|$)/.test(input.trim());
}

export function parse(syntax: string, options: ParseOptions = {}): ParsedConfig {
  const source = unwrapFence(syntax);
  const lines = tokenize(source, Boolean(options.streaming));
  const result: ParsedConfig = { type: '' };
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) {
      index += 1;
      continue;
    }

    if (line.indent === 0 && /^vis(?:\s|$)/.test(line.text)) {
      result.type = line.text.slice(3).trim();
      index += 1;
      continue;
    }

    if (line.indent === 0 && isSectionName(line.text)) {
      if (ARRAY_SECTIONS.has(line.text)) {
        const parsed = readArrayLike(lines, index);
        if (parsed.value !== undefined) setOwn(result, line.text, parsed.value);
        index = parsed.next;
        continue;
      }
      const parsed = readObject(lines, index);
      setOwn(result, line.text, parsed.value);
      index = parsed.next;
      continue;
    }

    if (line.indent === 0) {
      const pair = parseKeyValue(line.text);
      if (pair) setOwn(result, pair.key, parseValue(pair.value, pair.key));
    }
    index += 1;
  }

  return result;
}

export function readConfig(input: unknown, options: ParseOptions = {}): ParsedConfig {
  if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    const record = input as Record<string, unknown>;
    return { ...record, type: typeof record.type === 'string' ? record.type : '' };
  }
  if (typeof input !== 'string') return { type: '' };

  const trimmed = unwrapFence(input).trim();
  if (!trimmed) return { type: '' };
  if (options.streaming && (trimmed === 'vis' || 'vis '.startsWith(trimmed))) return { type: '' };

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return readConfig(JSON.parse(trimmed), options);
    } catch {
      return { type: '' };
    }
  }
  if (!isVisSyntax(trimmed)) return { type: 'summary', content: input };
  return parse(trimmed, options);
}

function unwrapFence(syntax: string): string {
  const trimmed = syntax.replace(/^\uFEFF/, '').trimStart();
  if (!trimmed.startsWith('```')) return syntax;
  const firstNewline = trimmed.indexOf('\n');
  if (firstNewline < 0) return '';
  const body = trimmed.slice(firstNewline + 1);
  return body.replace(/\n?```\s*$/, '');
}

function tokenize(syntax: string, streaming: boolean): Line[] {
  const normalized = syntax.replace(/\r\n/g, '\n');
  const raw = normalized.split('\n');
  if (streaming && raw.length > 0 && !normalized.endsWith('\n')) raw.pop();

  const lines: Line[] = [];
  for (const row of raw) {
    const text = row.trim();
    if (!text || text === '```') continue;
    lines.push({ text, indent: indentOf(row) });
  }
  return lines;
}

function indentOf(row: string): number {
  let width = 0;
  for (const char of row) {
    if (char === ' ') width += 1;
    else if (char === '\t') width += 2;
    else break;
  }
  return width;
}

function isSectionName(text: string): boolean {
  return /^[A-Za-z_][\w-]*$/.test(text) && (ARRAY_SECTIONS.has(text) || OBJECT_SECTIONS.has(text));
}

function isBullet(text: string): boolean {
  return text.startsWith('-');
}

function bulletBody(text: string): string {
  return text.replace(/^-\s*/, '');
}

function isQuoted(value: string): boolean {
  if (value.length < 2) return false;
  const quote = value[0];
  return (quote === '"' || quote === "'") && value.endsWith(quote) && value.indexOf(quote, 1) === value.length - 1;
}

function parseValue(raw: string, key?: string): unknown {
  const value = raw.trim();
  if (!value) return '';
  if (isQuoted(value)) return value.slice(1, -1);
  if (value === 'true') return true;
  if (value === 'false') return false;
  const numeric = Number(value);
  if (value !== '' && Number.isFinite(numeric)) return numeric;
  if (key === 'data' && /^-?(?:\d+(?:\.\d+)?|\d*\.\d+)(?:\s+-?(?:\d+(?:\.\d+)?|\d*\.\d+))+$/.test(value)) {
    return value.split(/\s+/).map((item) => Number(item));
  }
  return value;
}

function parseKeyValue(raw: string): { key: string; value: string } | null {
  const text = raw.trim();
  if (!text) return null;
  const assigned = text.match(/^([^:\s=]+)\s*[:=]\s*(.*)$/);
  if (assigned) return { key: assigned[1] ?? '', value: assigned[2] ?? '' };
  const spaced = text.match(/^(\S+)\s+(.*)$/);
  if (spaced) return { key: spaced[1] ?? '', value: spaced[2] ?? '' };
  return { key: text, value: '' };
}

function isScalarItem(body: string): boolean {
  if (isQuoted(body.trim())) return true;
  const pair = parseKeyValue(body);
  return !pair || pair.value === '';
}

function readArrayLike(lines: Line[], header: number): { value: unknown; next: number } {
  const line = lines[header];
  if (!line) return { value: undefined, next: header + 1 };
  const base = line.indent;
  const next = lines[header + 1];
  if (!next || next.indent <= base) {
    const pair = parseKeyValue(line.text);
    const inline = pair?.value ? parseValue(pair.value, pair.key) : undefined;
    return { value: inline, next: header + 1 };
  }

  if (!isBullet(next.text) && /^[A-Za-z_][\w-]*$/.test(next.text)) {
    return readNamedBlocks(lines, header + 1, base);
  }
  if (!isBullet(next.text)) return readTree(lines, header + 1, base);

  const list = readList(lines, header + 1, base);
  return { value: list.items.length ? list.items : undefined, next: list.next };
}

function readNamedBlocks(lines: Line[], start: number, base: number): { value: Record<string, unknown>; next: number } {
  const value: Record<string, unknown> = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (!line || line.indent <= base) break;
    if (/^[A-Za-z_][\w-]*$/.test(line.text) && !isBullet(line.text)) {
      const list = readList(lines, index + 1, line.indent);
      setOwn(value, line.text, list.items);
      index = list.next;
      continue;
    }
    index += 1;
  }
  return { value, next: index };
}

function readTree(lines: Line[], start: number, base: number): { value: Record<string, unknown>; next: number } {
  const node: Record<string, unknown> = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (!line || line.indent <= base) break;
    const pair = parseKeyValue(line.text);
    if (pair && (pair.key === 'children' || pair.key === 'data') && pair.value === '') {
      const list = readList(lines, index + 1, line.indent);
      setOwn(node, pair.key, list.items);
      index = list.next;
      continue;
    }
    if (pair) setOwn(node, pair.key, parseValue(pair.value, pair.key));
    index += 1;
  }
  return { value: node, next: index };
}

function readList(lines: Line[], start: number, base: number): { items: unknown[]; next: number } {
  const items: unknown[] = [];
  let current: Record<string, unknown> | null = null;
  let scalars = false;
  let itemIndent = -1;
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) break;
    if (line.indent <= base && !isBullet(line.text)) break;
    if (isBullet(line.text) && line.indent < base) break;

    const sameLevel = isBullet(line.text) && (itemIndent === -1 || line.indent === itemIndent);
    if (sameLevel) {
      if (itemIndent === -1) itemIndent = line.indent;
      if (current && !scalars) items.push(current);
      const body = bulletBody(line.text);
      if (!body) {
        current = {};
        scalars = false;
      } else if (isScalarItem(body)) {
        scalars = true;
        current = null;
        items.push(parseValue(body));
      } else {
        scalars = false;
        current = {};
        const pair = parseKeyValue(body);
        if (pair) setOwn(current, pair.key, parseValue(pair.value, pair.key));
      }
      index += 1;
      continue;
    }

    if (isBullet(line.text) && itemIndent !== -1 && line.indent !== itemIndent && current && !scalars) {
      items.push(current);
      current = {};
      const pair = parseKeyValue(bulletBody(line.text));
      if (pair) setOwn(current, pair.key, parseValue(pair.value, pair.key));
      itemIndent = line.indent;
      index += 1;
      continue;
    }

    if (current && !scalars) {
      const pair = parseKeyValue(line.text);
      if (pair && (pair.key === 'children' || pair.key === 'data') && pair.value === '') {
        const nested = readList(lines, index + 1, line.indent);
        setOwn(current, pair.key, nested.items);
        index = nested.next;
        continue;
      }
      if (pair) setOwn(current, pair.key, parseValue(pair.value, pair.key));
    }
    index += 1;
  }

  if (current && !scalars) items.push(current);
  return { items, next: index };
}

function readObject(lines: Line[], header: number): { value: Record<string, unknown>; next: number } {
  const line = lines[header];
  if (!line) return { value: {}, next: header + 1 };
  return readObjectBody(lines, header + 1, line.indent);
}

function readObjectBody(lines: Line[], start: number, base: number): { value: Record<string, unknown>; next: number } {
  const value: Record<string, unknown> = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (!line || line.indent <= base) break;
    if (isBullet(line.text)) {
      index += 1;
      continue;
    }
    const pair = parseKeyValue(line.text);
    if (!pair) {
      index += 1;
      continue;
    }
    const upcoming = lines[index + 1];
    if (pair.value === '' && upcoming && upcoming.indent > line.indent) {
      if (isBullet(upcoming.text)) {
        const list = readList(lines, index + 1, line.indent);
        setOwn(value, pair.key, list.items);
        index = list.next;
      } else {
        const child = readObjectBody(lines, index + 1, line.indent);
        setOwn(value, pair.key, child.value);
        index = child.next;
      }
      continue;
    }
    setOwn(value, pair.key, parseValue(pair.value, pair.key));
    index += 1;
  }
  return { value, next: index };
}
