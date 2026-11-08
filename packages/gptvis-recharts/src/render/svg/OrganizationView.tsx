import type { TreeModel, TreeNode } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgSurface } from './SvgSurface.js';

interface OrgNode {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
}

function leaves(node: TreeNode): number {
  return node.children?.length
    ? node.children.reduce((sum, child) => sum + leaves(child), 0)
    : 1;
}

function maxDepth(node: TreeNode, depth = 0): number {
  return Math.max(
    depth,
    ...(node.children ?? []).map((child) => maxDepth(child, depth + 1)),
  );
}

export function OrganizationView({ model }: { model: TreeModel }) {
  const theme = model.theme;
  const leafCount = leaves(model.root);
  const depth = maxDepth(model.root);
  const width = Math.max(760, leafCount * 178 + 80);
  const height = Math.max(420, depth * 104 + 150);
  const nodeWidth = 152;
  const nodeHeight = model.root.description ? 58 : 46;
  const nodes: OrgNode[] = [];
  const edges: Array<{ from: OrgNode; to: OrgNode }> = [];

  function place(node: TreeNode, depthIndex: number, left: number, right: number): OrgNode {
    const children = node.children ?? [];
    const center = (left + right) / 2;
    const current: OrgNode = {
      node,
      x: center,
      y: 50 + depthIndex * 104,
      depth: depthIndex,
    };
    nodes.push(current);
    if (children.length) {
      const total = children.reduce((sum, child) => sum + leaves(child), 0);
      let cursor = left;
      for (const child of children) {
        const childWidth = ((right - left) * leaves(child)) / total;
        const childNode = place(child, depthIndex + 1, cursor, cursor + childWidth);
        edges.push({ from: current, to: childNode });
        cursor += childWidth;
      }
    }
    return current;
  }

  place(model.root, 0, 42, width - 42);

  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface
        title={model.title || 'Organization chart'}
        description={`Organization rooted at ${model.root.name}`}
        width={width}
        height={height}
      >
        {edges.map((edge, index) => {
          const midY = (edge.from.y + edge.to.y) / 2;
          return (
            <path
              key={`${edge.from.node.name}-${edge.to.node.name}-${index}`}
              d={`M ${edge.from.x},${edge.from.y + nodeHeight / 2} V ${midY} H ${edge.to.x} V ${edge.to.y - nodeHeight / 2}`}
              fill="none"
              stroke={theme.border}
              strokeWidth={1.3}
            />
          );
        })}
        {nodes.map((item, index) => {
          const color =
            item.depth === 0
              ? theme.total
              : theme.palette[(item.depth - 1) % theme.palette.length];
          return (
            <g key={`${item.node.name}-${index}`}>
              <rect
                x={item.x - nodeWidth / 2}
                y={item.y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx={theme.radius + 2}
                fill={item.depth === 0 ? color : theme.background}
                stroke={color}
                strokeWidth={1.5}
              >
                <title>
                  {item.node.description
                    ? `${item.node.name}: ${item.node.description}`
                    : item.node.name}
                </title>
              </rect>
              <text
                x={item.x}
                y={item.y - (item.node.description ? 6 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={item.depth === 0 ? '#ffffff' : theme.text}
                fontFamily={theme.fontFamily}
                fontSize={11}
                fontWeight={650}
              >
                {item.node.name.length > 18 ? `${item.node.name.slice(0, 17)}…` : item.node.name}
              </text>
              {item.node.description && (
                <text
                  x={item.x}
                  y={item.y + 12}
                  textAnchor="middle"
                  fill={item.depth === 0 ? 'rgba(255,255,255,.78)' : theme.muted}
                  fontFamily={theme.fontFamily}
                  fontSize={9.5}
                >
                  {item.node.description.length > 24
                    ? `${item.node.description.slice(0, 23)}…`
                    : item.node.description}
                </text>
              )}
            </g>
          );
        })}
      </SvgSurface>
    </ChartFrame>
  );
}
