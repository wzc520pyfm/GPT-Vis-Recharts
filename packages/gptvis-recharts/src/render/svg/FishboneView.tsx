import type { TreeModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgSurface } from './SvgSurface.js';

export function FishboneView({ model }: { model: TreeModel }) {
  const theme = model.theme;
  const width = 940;
  const height = 480;
  const spineY = 240;
  const spineStart = 58;
  const rootX = 684;
  const rootWidth = 174;
  const rootHeight = 64;
  const causes = model.root.children ?? [];
  const usableWidth = 520;
  const step = causes.length > 1 ? usableWidth / causes.length : usableWidth;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface
        title={model.title || 'Fishbone diagram'}
        description={`Cause analysis for ${model.root.name}`}
        width={width}
        height={height}
      >
        <line
          x1={spineStart}
          x2={rootX}
          y1={spineY}
          y2={spineY}
          stroke={theme.text}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {causes.map((cause, index) => {
          const attachX = rootX - 40 - index * step;
          const above = index % 2 === 0;
          const endY = above ? 82 : 398;
          const endX = Math.max(72, attachX - 122);
          const color = theme.palette[index % theme.palette.length];
          const children = cause.children ?? [];
          return (
            <g key={cause.name}>
              <line
                x1={attachX}
                y1={spineY}
                x2={endX}
                y2={endY}
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <rect
                x={endX - 52}
                y={endY - 15}
                width={116}
                height={30}
                rx={7}
                fill={color}
                fillOpacity={0.17}
                stroke={color}
              >
                <title>{cause.name}</title>
              </rect>
              <text
                x={endX + 6}
                y={endY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={theme.text}
                fontFamily={theme.fontFamily}
                fontSize={10.5}
                fontWeight={650}
              >
                {cause.name.length > 14 ? `${cause.name.slice(0, 13)}…` : cause.name}
              </text>
              {children.slice(0, 6).map((child, childIndex) => {
                const childY =
                  endY + (above ? -1 : 1) * (26 + childIndex * 21);
                return (
                  <g key={`${cause.name}-${child.name}`}>
                    <line
                      x1={endX - 24}
                      x2={endX + 40}
                      y1={childY}
                      y2={childY}
                      stroke={color}
                      strokeOpacity={0.6}
                    />
                    <text
                      x={endX + 4}
                      y={childY - 4}
                      textAnchor="middle"
                      fill={theme.muted}
                      fontFamily={theme.fontFamily}
                      fontSize={9}
                    >
                      {child.name.length > 18 ? `${child.name.slice(0, 17)}…` : child.name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        <rect
          x={rootX}
          y={spineY - rootHeight / 2}
          width={rootWidth}
          height={rootHeight}
          rx={12}
          fill={theme.total}
        >
          <title>{model.root.name}</title>
        </rect>
        <text
          x={rootX + rootWidth / 2}
          y={spineY}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          fontFamily={theme.fontFamily}
          fontSize={13}
          fontWeight={700}
        >
          {model.root.name.length > 18
            ? `${model.root.name.slice(0, 17)}…`
            : model.root.name}
        </text>
      </SvgSurface>
    </ChartFrame>
  );
}
