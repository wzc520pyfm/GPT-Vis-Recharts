import { Treemap, type TreemapNode } from 'recharts';
import type { TreemapModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';

export function TreemapView({
  model,
  streaming = false,
}: {
  model: TreemapModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  const content = (node: TreemapNode) => {
    const x = Number(node.x ?? 0);
    const y = Number(node.y ?? 0);
    const width = Number(node.width ?? 0);
    const height = Number(node.height ?? 0);
    const depth = Number(node.depth ?? 0);
    const index = Number(node.index ?? 0);
    const value = Number(node.value ?? 0);
    const color = theme.palette[(index + depth) % theme.palette.length] ?? theme.palette[0];
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={Math.max(0, width)}
          height={Math.max(0, height)}
          fill={color}
          fillOpacity={depth === 0 ? 0.95 : Math.max(0.42, 0.92 - depth * 0.12)}
          stroke={theme.background}
          strokeWidth={2}
          rx={depth === 0 ? 4 : 2}
        >
          <title>{`${node.name}: ${value.toLocaleString()}`}</title>
        </rect>
        {width > 68 && height > 30 && (
          <text
            x={x + 6}
            y={y + 18}
            fill="#ffffff"
            fontSize={depth === 0 ? 12 : 11}
            fontFamily={theme.fontFamily}
            fontWeight={600}
          >
            {String(node.name ?? '')}
          </text>
        )}
        {width > 68 && height > 48 && (
          <text
            x={x + 6}
            y={y + 34}
            fill="#ffffff"
            fillOpacity={0.82}
            fontSize={10}
            fontFamily={theme.fontFamily}
          >
            {value.toLocaleString()}
          </text>
        )}
      </g>
    );
  };

  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <Treemap
          data={model.data as unknown as ReadonlyArray<{ [key: string]: unknown }>}
          dataKey="value"
          nameKey="name"
          stroke={theme.background}
          fill={theme.palette[0]}
          aspectRatio={1.5}
          content={content}
          isAnimationActive={!streaming}
        />
      </ChartSurface>
    </ChartFrame>
  );
}
