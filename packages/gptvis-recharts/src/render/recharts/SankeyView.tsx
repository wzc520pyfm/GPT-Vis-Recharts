import {
  Sankey,
  type SankeyLinkProps,
  type SankeyNodeProps,
  Tooltip,
} from 'recharts';
import type { SankeyModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import { tooltipStyle } from './axis.js';

export function SankeyView({
  model,
  streaming = false,
}: {
  model: SankeyModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  const data = {
    nodes: model.nodes.map((node) => ({ name: node.name })),
    links: model.links,
  };
  const node = (props: SankeyNodeProps) => {
    const nodeIndex = Number(props.index ?? 0);
    const color = theme.palette[nodeIndex % theme.palette.length];
    return (
      <rect
        x={props.x}
        y={props.y}
        width={props.width}
        height={props.height}
        fill={color}
        rx={2}
      />
    );
  };
  const link = (props: SankeyLinkProps) => {
    const sourceName = props.payload.source?.name;
    const sourceIndex = Math.max(
      0,
      model.nodes.findIndex((item) => item.name === sourceName),
    );
    const color = theme.palette[sourceIndex % theme.palette.length];
    return (
      <path
        d={`M${props.sourceX},${props.sourceY}C${props.sourceControlX},${props.sourceY} ${props.targetControlX},${props.targetY} ${props.targetX},${props.targetY}`}
        stroke={color}
        strokeWidth={Math.max(1, props.linkWidth)}
        strokeOpacity={0.28}
        fill="none"
        strokeLinecap="round"
      />
    );
  };
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <Sankey
          data={data}
          nodeWidth={10}
          nodePadding={16}
          align={model.nodeAlign === 'left' ? 'left' : 'justify'}
          node={node}
          link={link}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          accessibilityLayer
        >
          <Tooltip {...tooltipStyle(theme)} />
        </Sankey>
      </ChartSurface>
    </ChartFrame>
  );
}
