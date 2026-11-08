import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LineModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import {
  axisLabelStyle,
  axisLine,
  axisTick,
  CARTESIAN_MARGIN,
  legendStyle,
  tooltipStyle,
} from './axis.js';

export function AreaView({ model, streaming = false }: { model: LineModel; streaming?: boolean }) {
  const theme = model.theme;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <AreaChart data={model.data} margin={CARTESIAN_MARGIN} accessibilityLayer>
          <defs>
            {model.series.map((series) => {
              const color = theme.palette[series.colorIndex % theme.palette.length];
              return (
                <linearGradient key={series.key} id={`gvr-area-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.04} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="category"
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            minTickGap={16}
            label={
              model.axisXTitle
                ? {
                    value: model.axisXTitle,
                    position: 'insideBottom',
                    offset: -5,
                    style: axisLabelStyle(theme),
                  }
                : undefined
            }
          />
          <YAxis
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            width={56}
            label={
              model.axisYTitle
                ? {
                    value: model.axisYTitle,
                    angle: -90,
                    position: 'insideLeft',
                    style: axisLabelStyle(theme),
                  }
                : undefined
            }
          />
          <Tooltip {...tooltipStyle(theme)} />
          {model.series.length > 1 && <Legend wrapperStyle={legendStyle(theme)} />}
          {model.series.map((series) => (
            <Area
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stackId={model.stacked ? 'stack' : undefined}
              stroke={theme.palette[series.colorIndex % theme.palette.length]}
              fill={`url(#gvr-area-${series.key})`}
              strokeWidth={theme.lineWidth}
              connectNulls
              isAnimationActive={!streaming}
            />
          ))}
        </AreaChart>
      </ChartSurface>
    </ChartFrame>
  );
}
