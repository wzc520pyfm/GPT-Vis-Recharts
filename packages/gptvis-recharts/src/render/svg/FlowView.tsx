import { useId } from 'react';
import type { GraphModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgSurface } from './SvgSurface.js';
import { approximateTextWidth } from './scale.js';
import { layeredPositions } from './graph-layout.js';

export function FlowView({ model }: { model: GraphModel }) {
  const theme = model.theme;
  const id = useId().replace(/:/g, '');
  const nodeWidth = 156;
  const nodeHeight = 44;
  const depthCount = Math.max(
    1,
    new Set(
      [...layeredPositions(model.nodes, model.edges, 800, 420).values()].map((point) =>
        Math.round(point.x),
      ),
    ).size,
  );
  const rowCount = Math.max(
    1,
    Math.ceil(model.nodes.length / Math.max(1, depthCount)),
  );
  const width = Math.max(720, 110 + (depthCount - 1) * (nodeWidth + 62) + nodeWidth);
  const height = Math.max(420, 80 + rowCount * (nodeHeight + 24));
  const positions = layeredPositions(
    model.nodes,
    model.edges,
    width,
    height,
    54,
    54,
    48,
    48,
  );
  const markerId = `gvr-flow-arrow-${id}`;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface title={model.title || 'Flow diagram'} width={width} height={height}>
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 8 4 L 0 8 Z" fill={theme.muted} />
          </marker>
        </defs>
        {model.edges.map((edge, index) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;
          const x1 = source.x + nodeWidth / 2;
          const x2 = target.x - nodeWidth / 2;
          const mid = (x1 + x2) / 2;
          const path = `M ${x1},${source.y} C ${mid},${source.y} ${mid},${target.y} ${x2},${target.y}`;
          return (
            <g key={`${edge.source}-${edge.target}-${index}`}>
              <path
                d={path}
                fill="none"
                stroke={theme.border}
                strokeWidth={1.3}
                markerEnd={`url(#${markerId})`}
              />
              {edge.name && (
                <text
                  x={(x1 + x2) / 2}
                  y={(source.y + target.y) / 2 - 5}
                  textAnchor="middle"
                  fill={theme.muted}
                  fontSize={9}
                  fontFamily={theme.fontFamily}
                >
                  {edge.name}
                </text>
              )}
            </g>
          );
        })}
        {model.nodes.map((node, index) => {
          const point = positions.get(node.name);
          if (!point) return null;
          const color = theme.palette[index % theme.palette.length];
          const label =
            approximateTextWidth(node.name, 11) > nodeWidth - 20
              ? `${node.name.slice(0, 16)}…`
              : node.name;
          return (
            <g key={node.name}>
              <rect
                x={point.x - nodeWidth / 2}
                y={point.y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx={theme.radius + 2}
                fill={color}
                fillOpacity={0.16}
                stroke={color}
                strokeWidth={1.6}
              >
                <title>{node.name}</title>
              </rect>
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={theme.text}
                fontFamily={theme.fontFamily}
                fontSize={11}
                fontWeight={600}
              >
                {label}
              </text>
            </g>
          );
        })}
      </SvgSurface>
    </ChartFrame>
  );
}
