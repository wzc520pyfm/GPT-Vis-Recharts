import type { TreeModel, TreeNode } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgSurface } from './SvgSurface.js';
import { approximateTextWidth } from './scale.js';

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  depth: number;
  colorIndex: number;
}

function leaves(node: TreeNode): number {
  return node.children?.length
    ? node.children.reduce((total, child) => total + leaves(child), 0)
    : 1;
}

function branchColor(node: TreeNode, index: number): number {
  void node;
  return index;
}

export function MindmapView({ model }: { model: TreeModel }) {
  const theme = model.theme;
  const rootChildren = model.root.children ?? [];
  const leftChildren =
    model.direction === 'H'
      ? rootChildren.slice(0, Math.ceil(rootChildren.length / 2))
      : [];
  const rightChildren =
    model.direction === 'H'
      ? rootChildren.slice(Math.ceil(rootChildren.length / 2))
      : rootChildren;
  const maxSideLeaves = Math.max(
    1,
    leaves({ name: 'left', children: leftChildren }),
    leaves({ name: 'right', children: rightChildren }),
  );
  const width =
    model.direction === 'H'
      ? Math.max(820, 680 + Math.max(1, Math.min(5, rootChildren.length)) * 18)
      : 900;
  const height = Math.max(420, 120 + maxSideLeaves * 46);
  const nodes: LayoutNode[] = [];
  const edges: Array<{ from: LayoutNode; to: LayoutNode; colorIndex: number }> = [];

  const rootX = model.direction === 'H' ? width / 2 : model.direction === 'RL' ? width - 120 : 120;
  const root: LayoutNode = {
    node: model.root,
    x: rootX,
    y: height / 2,
    depth: 0,
    colorIndex: -1,
  };
  nodes.push(root);

  function place(
    parent: LayoutNode,
    children: TreeNode[],
    side: -1 | 1,
    top: number,
    bottom: number,
    depth: number,
  ) {
    const total = Math.max(1, children.reduce((sum, child) => sum + leaves(child), 0));
    let cursor = top;
    children.forEach((child, index) => {
      const childLeaves = leaves(child);
      const childTop = cursor;
      const childBottom = cursor + ((bottom - top) * childLeaves) / total;
      cursor = childBottom;
      const colorIndex = depth === 1 ? index % theme.palette.length : parent.colorIndex;
      const node: LayoutNode = {
        node: child,
        x:
          model.direction === 'H'
            ? parent.x + side * 170
            : parent.x + (model.direction === 'RL' ? -1 : 1) * 185,
        y: (childTop + childBottom) / 2,
        depth,
        colorIndex: colorIndex < 0 ? 0 : colorIndex,
      };
      nodes.push(node);
      edges.push({ from: parent, to: node, colorIndex: node.colorIndex });
      if (child.children?.length) {
        place(node, child.children, side, childTop, childBottom, depth + 1);
      }
    });
  }

  if (model.direction === 'H') {
    if (leftChildren.length) place(root, leftChildren, -1, 50, height - 50, 1);
    if (rightChildren.length) place(root, rightChildren, 1, 50, height - 50, 1);
  } else {
    if (rightChildren.length) place(root, rightChildren, 1, 50, height - 50, 1);
  }

  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface
        title={model.title || 'Mind map'}
        description={`Mind map rooted at ${model.root.name}`}
        width={width}
        height={height}
      >
        {edges.map((edge, index) => {
          const color = theme.palette[edge.colorIndex % theme.palette.length];
          const midX = (edge.from.x + edge.to.x) / 2;
          return (
            <path
              key={`${edge.from.node.name}-${edge.to.node.name}-${index}`}
              d={`M ${edge.from.x},${edge.from.y} C ${midX},${edge.from.y} ${midX},${edge.to.y} ${edge.to.x},${edge.to.y}`}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.72}
            />
          );
        })}
        {nodes.map((item, index) => {
          const accent =
            item.colorIndex < 0
              ? theme.total
              : theme.palette[item.colorIndex % theme.palette.length];
          const widthForNode = Math.min(
            170,
            Math.max(72, approximateTextWidth(item.node.name, item.depth === 0 ? 14 : 11) + 28),
          );
          return (
            <g key={`${item.node.name}-${index}`}>
              <rect
                x={item.x - widthForNode / 2}
                y={item.y - 15}
                width={widthForNode}
                height={30}
                rx={item.depth === 0 ? 12 : 7}
                fill={item.depth === 0 ? accent : theme.background}
                stroke={accent}
                strokeWidth={item.depth === 0 ? 0 : 1.5}
              >
                <title>{item.node.name}</title>
              </rect>
              <text
                x={item.x}
                y={item.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={item.depth === 0 ? '#ffffff' : theme.text}
                fontFamily={theme.fontFamily}
                fontSize={item.depth === 0 ? 13 : 10.5}
                fontWeight={item.depth <= 1 ? 650 : 500}
              >
                {item.node.name.length > 22
                  ? `${item.node.name.slice(0, 21)}…`
                  : item.node.name}
              </text>
            </g>
          );
        })}
      </SvgSurface>
    </ChartFrame>
  );
}
