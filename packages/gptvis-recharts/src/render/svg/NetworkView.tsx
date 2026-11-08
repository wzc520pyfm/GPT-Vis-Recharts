import { useId } from 'react';
import type { GraphModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgSurface } from './SvgSurface.js';
import { degreeMap, networkPositions } from './graph-layout.js';

export function NetworkView({ model }: { model: GraphModel }) {
  const theme = model.theme;
  const id = useId().replace(/:/g, '');
  const positions = networkPositions(model.nodes, model.edges, model.layout);
  const degrees = degreeMap(model.nodes, model.edges);
  const markerId = `gvr-network-arrow-${id}`;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface
        title={model.title || 'Network graph'}
        description={`${model.nodes.length} nodes, ${model.edges.length} edges, ${model.layout} layout`}
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M 0 0 L 7 3.5 L 0 7 Z" fill={theme.border} />
          </marker>
        </defs>
        {model.edges.map((edge, index) => {
          const source = positions.get(edge.source);
          const target = positions.get(edge.target);
          if (!source || !target) return null;
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const sourceRadius = Math.min(25, 16 + (degrees.get(edge.source) ?? 0) * 0.8);
          const targetRadius = Math.min(25, 16 + (degrees.get(edge.target) ?? 0) * 0.8);
          const x1 = source.x + (dx / distance) * sourceRadius;
          const y1 = source.y + (dy / distance) * sourceRadius;
          const x2 = target.x - (dx / distance) * (targetRadius + 2);
          const y2 = target.y - (dy / distance) * (targetRadius + 2);
          return (
            <g key={`${edge.source}-${edge.target}-${index}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.border}
                strokeWidth={1}
                strokeOpacity={0.72}
                markerEnd={`url(#${markerId})`}
              >
                <title>{edge.name ? `${edge.source} — ${edge.name} → ${edge.target}` : `${edge.source} → ${edge.target}`}</title>
              </line>
              {edge.name && model.edges.length <= 24 && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 4}
                  textAnchor="middle"
                  fill={theme.muted}
                  fontSize={9}
                  fontFamily={theme.fontFamily}
                  paintOrder="stroke"
                  stroke={theme.background}
                  strokeWidth={4}
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
          const radius = Math.min(25, 16 + (degrees.get(node.name) ?? 0) * 0.8);
          const color = theme.palette[index % theme.palette.length];
          return (
            <g key={node.name}>
              <circle
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={color}
                fillOpacity={0.86}
                stroke={theme.background}
                strokeWidth={2}
              >
                <title>{node.name}</title>
              </circle>
              <text
                x={point.x}
                y={point.y + radius + 13}
                textAnchor="middle"
                fill={theme.text}
                fontFamily={theme.fontFamily}
                fontSize={10}
                fontWeight={600}
                paintOrder="stroke"
                stroke={theme.background}
                strokeWidth={4}
              >
                {node.name.length > 16 ? `${node.name.slice(0, 15)}…` : node.name}
              </text>
            </g>
          );
        })}
      </SvgSurface>
    </ChartFrame>
  );
}
