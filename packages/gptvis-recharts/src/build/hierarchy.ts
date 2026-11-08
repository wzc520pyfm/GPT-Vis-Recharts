import type { VisualizationTheme } from '../types/theme.js';
import type {
  GraphModel,
  SankeyModel,
  TreeModel,
  TreemapModel,
  TreemapNode,
  TreeNode,
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

function normalizePath(value: unknown): string {
  return asString(value).replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/+$/, '');
}

function sanitizeTreemap(
  value: unknown,
  depth: number,
  counter: { count: number },
): TreemapNode | null {
  if (depth > LIMITS.treeDepth) {
    throw new ValidationError(`tree depth exceeds ${LIMITS.treeDepth}`);
  }
  counter.count += 1;
  if (counter.count > LIMITS.nodes) {
    throw new ValidationError(`tree nodes exceed ${LIMITS.nodes}`);
  }
  const record = asRecord(value);
  const name = asString(record.name);
  if (!name) return null;
  const children = asArray(record.children)
    .map((child) => sanitizeTreemap(child, depth + 1, counter))
    .filter((child): child is TreemapNode => child !== null);
  const sum = children.reduce((total, child) => total + child.value, 0);
  const supplied = asFinite(record.value);
  const numeric = supplied ?? sum;
  if (numeric === undefined || numeric < 0) return null;
  return children.length
    ? { name, value: numeric, children }
    : { name, value: numeric };
}

export function normalizeTreemap(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): TreemapModel {
  const data = assertRows(config.data)
    .map((item) => sanitizeTreemap(item, 0, { count: 0 }))
    .filter((item): item is TreemapNode => item !== null);
  return {
    ...makeBase('treemap', config, theme),
    type: 'treemap',
    data,
  };
}

export function normalizeSankey(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
): SankeyModel {
  const rows = assertRows(config.data);
  const nodes: SankeyModel['nodes'] = [];
  const index = new Map<string, number>();
  const links: SankeyModel['links'] = [];

  for (const row of rows) {
    const record = asRecord(row);
    const source = asString(record.source);
    const target = asString(record.target);
    const value = asFinite(record.value);
    if (!source || !target || value === undefined || value < 0) continue;
    for (const name of [source, target]) {
      if (!index.has(name)) {
        index.set(name, nodes.length);
        nodes.push({ name, colorIndex: nodes.length });
      }
    }
    links.push({
      source: index.get(source) ?? 0,
      target: index.get(target) ?? 0,
      value,
    });
  }

  if (nodes.length > LIMITS.nodes) throw new ValidationError(`nodes exceed ${LIMITS.nodes}`);
  if (links.length > LIMITS.edges) throw new ValidationError(`edges exceed ${LIMITS.edges}`);
  const align = config.nodeAlign;
  const nodeAlign =
    align === 'left' || align === 'right' || align === 'justify' ? align : 'center';
  return {
    ...makeBase('sankey', config, theme),
    type: 'sankey',
    nodes,
    links,
    nodeAlign,
  };
}

export function normalizeGraph(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
  type: 'flow-diagram' | 'network-graph',
): GraphModel {
  const data = asRecord(config.data);
  const rawNodes = asArray(data.nodes);
  const rawEdges = asArray(data.edges);
  if (rawNodes.length > LIMITS.nodes) throw new ValidationError(`nodes exceed ${LIMITS.nodes}`);
  if (rawEdges.length > LIMITS.edges) throw new ValidationError(`edges exceed ${LIMITS.edges}`);

  const nodes: GraphModel['nodes'] = [];
  const names = new Set<string>();
  for (const item of rawNodes) {
    const name = asString(asRecord(item).name).trim();
    if (!name || names.has(name)) continue;
    names.add(name);
    nodes.push({ name });
  }

  const edges: GraphModel['edges'] = [];
  for (const item of rawEdges) {
    const record = asRecord(item);
    const source = asString(record.source).trim();
    const target = asString(record.target).trim();
    if (!source || !target || !names.has(source) || !names.has(target)) continue;
    const name = asString(record.name).trim();
    edges.push(name ? { source, target, name } : { source, target });
  }

  const layouts = ['force', 'circular', 'grid', 'radial', 'concentric', 'dagre'] as const;
  const requested = config.layout;
  const layout = layouts.find((item) => item === requested) ?? (type === 'flow-diagram' ? 'dagre' : 'force');
  return {
    ...makeBase(type, config, theme),
    type,
    nodes,
    edges,
    layout,
  };
}

function normalizeRoot(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length === 1) return value[0];
    if (value.length === 0) return null;
    throw new ValidationError('tree data requires exactly one root');
  }
  return value;
}

function sanitizeTreeNode(
  value: unknown,
  depth: number,
  counter: { count: number },
): TreeNode | null {
  if (depth > LIMITS.treeDepth) {
    throw new ValidationError(`tree depth exceeds ${LIMITS.treeDepth}`);
  }
  counter.count += 1;
  if (counter.count > LIMITS.nodes) {
    throw new ValidationError(`tree nodes exceed ${LIMITS.nodes}`);
  }
  const record = asRecord(value);
  const name = asString(record.name).trim();
  if (!name) return null;
  const childrenInput = record.children;
  const rawChildren = Array.isArray(childrenInput) ? childrenInput : childrenInput ? [childrenInput] : [];
  const children = rawChildren
    .map((child) => sanitizeTreeNode(child, depth + 1, counter))
    .filter((child): child is TreeNode => child !== null);
  const description = asString(record.description).trim();
  return {
    name,
    ...(description ? { description } : {}),
    ...(children.length ? { children } : {}),
  };
}

export function normalizeTree(
  config: Record<string, unknown>,
  theme: VisualizationTheme | undefined,
  type: 'mindmap' | 'indented-tree' | 'organization-chart' | 'fishbone-diagram',
): TreeModel {
  const rootValue = normalizeRoot(config.data);
  const root = rootValue ? sanitizeTreeNode(rootValue, 0, { count: 0 }) : null;
  if (!root) throw new ValidationError('tree data requires a root node with a name');
  const rawDirection = config.direction;
  const direction =
    rawDirection === 'LR' || rawDirection === 'RL'
      ? rawDirection
      : type === 'mindmap'
        ? 'H'
        : 'LR';
  return {
    ...makeBase(type, config, theme),
    type,
    root,
    direction,
  };
}

export function normalizePathLabel(value: unknown): string {
  return normalizePath(value);
}
