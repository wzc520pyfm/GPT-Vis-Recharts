import type { ReactNode } from 'react';
import type { ResolvedTheme } from '../../types/theme.js';
import { SvgSurface } from './SvgSurface.js';
import {
  bandScale,
  compactNumber,
  linearScale,
  niceDomain,
  niceTicks,
} from './scale.js';

export interface SvgCartesianContext {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotWidth: number;
  plotHeight: number;
  xBand: ReturnType<typeof bandScale>;
  yScale: (value: number) => number;
  yDomain: [number, number];
  yTicks: number[];
}

export interface SvgCartesianChartProps {
  title: string;
  description?: string;
  theme: ResolvedTheme;
  xLabels: string[];
  yValues: number[];
  xTitle?: string;
  yTitle?: string;
  includeZero?: boolean;
  width?: number;
  height?: number;
  children: (context: SvgCartesianContext) => ReactNode;
}

export function SvgCartesianChart({
  title,
  description,
  theme,
  xLabels,
  yValues,
  xTitle,
  yTitle,
  includeZero = false,
  width = 800,
  height = 420,
  children,
}: SvgCartesianChartProps) {
  const left = yTitle ? 74 : 56;
  const right = 24;
  const top = 20;
  const bottom = xTitle ? 66 : 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const yDomain = niceDomain(yValues, includeZero);
  const yTicks = niceTicks(yDomain[0], yDomain[1], 5);
  const yScale = linearScale(
    [yTicks[0] ?? yDomain[0], yTicks[yTicks.length - 1] ?? yDomain[1]],
    [top + plotHeight, top],
  );
  const xBand = bandScale(xLabels.length, [left, left + plotWidth], 0.2);
  const rotateLabels =
    xLabels.length > 7 ||
    xLabels.some((label) => label.length > 8) ||
    xLabels.some((label) => /[\u2e80-\u9fff]/.test(label) && label.length > 5);

  const context: SvgCartesianContext = {
    width,
    height,
    left,
    right,
    top,
    bottom,
    plotWidth,
    plotHeight,
    xBand,
    yScale,
    yDomain,
    yTicks,
  };

  return (
    <SvgSurface title={title} description={description} width={width} height={height}>
      <g>
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={left}
              x2={left + plotWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke={theme.grid}
              strokeDasharray="3 5"
            />
            <text
              x={left - 8}
              y={yScale(tick)}
              dy="0.32em"
              textAnchor="end"
              fill={theme.muted}
              fontSize={10}
              fontFamily={theme.fontFamily}
            >
              {compactNumber(tick)}
            </text>
          </g>
        ))}
        <line
          x1={left}
          x2={left}
          y1={top}
          y2={top + plotHeight}
          stroke={theme.border}
        />
        <line
          x1={left}
          x2={left + plotWidth}
          y1={top + plotHeight}
          y2={top + plotHeight}
          stroke={theme.border}
        />
        {xLabels.map((label, index) => (
          <text
            key={`x-${index}-${label}`}
            x={xBand.center(index)}
            y={top + plotHeight + 16}
            textAnchor={rotateLabels ? 'end' : 'middle'}
            fill={theme.muted}
            fontSize={10}
            fontFamily={theme.fontFamily}
            transform={
              rotateLabels
                ? `rotate(-28 ${xBand.center(index)} ${top + plotHeight + 16})`
                : undefined
            }
          >
            {label}
          </text>
        ))}
        {xTitle && (
          <text
            x={left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fill={theme.muted}
            fontSize={11}
            fontFamily={theme.fontFamily}
          >
            {xTitle}
          </text>
        )}
        {yTitle && (
          <text
            x={13}
            y={top + plotHeight / 2}
            textAnchor="middle"
            fill={theme.muted}
            fontSize={11}
            fontFamily={theme.fontFamily}
            transform={`rotate(-90 13 ${top + plotHeight / 2})`}
          >
            {yTitle}
          </text>
        )}
        {children(context)}
      </g>
    </SvgSurface>
  );
}
