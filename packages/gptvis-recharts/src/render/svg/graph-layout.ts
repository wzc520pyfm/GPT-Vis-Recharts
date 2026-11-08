import type { GraphEdge, GraphNode } from '../../build/types.js';

export interface Point {
  x: number;
  y: number;
}

export function layeredPositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  left = 40,
  right = 40,
  top = 30,
  bottom = 30,
): Map<string, Point> {
  const depth = new Map(nodes.map((node) => [node.name, 0]));
  for (let iteration = 0; iteration < nodes.length; iteration += 1) {
    let changed = false;
    for (const edge of edges) {
      const sourceDepth = depth.get(edge.source) ?? 0;
      const targetDepth = depth.get(edge.target) ?? 0;
      if (targetDepth <= sourceDepth && sourceDepth + 1 < nodes.length) {
        depth.set(edge.target, sourceDepth + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const columns = new Map<number, string[]>();
  for (const node of nodes) {
    const level = depth.get(node.name) ?? 0;
    const list = columns.get(level) ?? [];
    list.push(node.name);
    columns.set(level, list);
  }
  const maxDepth = Math.max(0, ...columns.keys());
  const positions = new Map<string, Point>();
  for (const [level, names] of columns) {
    const x =
      maxDepth === 0
        ? (left + width - right) / 2
        : left + ((width - left - right) * level) / maxDepth;
    names.forEach((name, index) => {
      positions.set(name, {
        x,
        y:
          names.length === 1
            ? (top + height - bottom) / 2
            : top + ((height - top - bottom) * (index + 0.5)) / names.length,
      });
    });
  }
  return positions;
}

export function degreeMap(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const map = new Map(nodes.map((node) => [node.name, 0]));
  for (const edge of edges) {
    map.set(edge.source, (map.get(edge.source) ?? 0) + 1);
    map.set(edge.target, (map.get(edge.target) ?? 0) + 1);
  }
  return map;
}

function forceLayout(nodes: GraphNode[], edges: GraphEdge[]): Map<string, Point> {
  const width = 800;
  const height = 420;
  const centerX = width / 2;
  const centerY = height / 2;
  const count = Math.max(1, nodes.length);
  const positions = new Map<string, Point>();
  nodes.forEach((node, index) => {
    const angle = (index / count) * Math.PI * 2;
    positions.set(node.name, {
      x: centerX + Math.cos(angle) * Math.min(250, 80 + count * 4),
      y: centerY + Math.sin(angle) * Math.min(150, 50 + count * 2.5),
    });
  });
  if (nodes.length < 2) return positions;

  const area = 680 * 330;
  const ideal = Math.sqrt(area / nodes.length) * 0.72;
  const iterations = nodes.length > 120 ? 60 : 120;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const forces = new Map(nodes.map((node) => [node.name, { x: 0, y: 0 }]));
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      const pa = a ? positions.get(a.name) : undefined;
      if (!a || !pa) continue;
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const pb = b ? positions.get(b.name) : undefined;
        if (!b || !pb) continue;
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 0.01) {
          dx = 0.01 * (i - j);
          dy = 0.01 * (j - i);
          distance = 0.02;
        }
        const repulsion = (ideal * ideal) / distance;
        const fx = (dx / distance) * repulsion;
        const fy = (dy / distance) * repulsion;
        const fa = forces.get(a.name);
        const fb = forces.get(b.name);
        if (fa) {
          fa.x += fx;
          fa.y += fy;
        }
        if (fb) {
          fb.x -= fx;
          fb.y -= fy;
        }
      }
    }
    for (const edge of edges) {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const attraction = (distance * distance) / (ideal * 8);
      const fx = (dx / distance) * attraction;
      const fy = (dy / distance) * attraction;
      const fs = forces.get(edge.source);
      const ft = forces.get(edge.target);
      if (fs) {
        fs.x += fx;
        fs.y += fy;
      }
      if (ft) {
        ft.x -= fx;
        ft.y -= fy;
      }
    }
    const cooling = 1 - iteration / iterations;
    for (const node of nodes) {
      const point = positions.get(node.name);
      const force = forces.get(node.name);
      if (!point || !force) continue;
      point.x = Math.max(52, Math.min(width - 52, point.x + force.x * 0.06 * cooling));
      point.y = Math.max(42, Math.min(height - 58, point.y + force.y * 0.06 * cooling));
    }
  }
  return positions;
}

export function networkPositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layout: 'force' | 'circular' | 'grid' | 'radial' | 'concentric' | 'dagre',
): Map<string, Point> {
  if (layout === 'dagre') return layeredPositions(nodes, edges, 800, 420, 72, 72, 42, 58);
  if (layout === 'force') return forceLayout(nodes, edges);
  const centerX = 400;
  const centerY = 205;
  const count = Math.max(1, nodes.length);
  const positions = new Map<string, Point>();
  const degrees = degreeMap(nodes, edges);

  if (layout === 'grid') {
    const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / columns));
    nodes.forEach((node, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      positions.set(node.name, {
        x: 90 + (620 * (column + 0.5)) / columns,
        y: 55 + (310 * (row + 0.5)) / rows,
      });
    });
    return positions;
  }

  if (layout === 'circular') {
    const radiusX = Math.min(300, 110 + count * 4);
    const radiusY = Math.min(145, 60 + count * 2.4);
    nodes.forEach((node, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.name, {
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    });
    return positions;
  }

  if (layout === 'radial') {
    const sorted = [...nodes].sort((a, b) => (degrees.get(b.name) ?? 0) - (degrees.get(a.name) ?? 0));
    const root = sorted[0];
    if (root) positions.set(root.name, { x: centerX, y: centerY });
    const rest = sorted.slice(1);
    rest.forEach((node, index) => {
      const angle = (index / Math.max(1, rest.length)) * Math.PI * 2 - Math.PI / 2;
      const ring = 1 + Math.floor(index / 14);
      positions.set(node.name, {
        x: centerX + Math.cos(angle) * (58 + ring * 48),
        y: centerY + Math.sin(angle) * (52 + ring * 42),
      });
    });
    return positions;
  }

  const sorted = [...nodes].sort((a, b) => (degrees.get(b.name) ?? 0) - (degrees.get(a.name) ?? 0));
  const buckets: GraphNode[][] = [];
  sorted.forEach((node, index) => {
    const bucketIndex = Math.min(3, Math.floor((index / Math.max(1, sorted.length)) * 4));
    (buckets[bucketIndex] ??= []).push(node);
  });
  buckets.forEach((bucket, bucketIndex) => {
    bucket.forEach((node, index) => {
      const angle = (index / Math.max(1, bucket.length)) * Math.PI * 2 - Math.PI / 2;
      const radius = 30 + bucketIndex * 60;
      positions.set(node.name, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.72,
      });
    });
  });
  return positions;
}
