import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import type { HistogramModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import {
  axisLabelStyle,
  axisLine,
  axisTick,
  CARTESIAN_MARGIN,
  tooltipStyle,
} from './axis.js';

export function HistogramView({
  model,
  streaming = false,
}: {
  model: HistogramModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <BarChart data={model.data} margin={CARTESIAN_MARGIN} barCategoryGap="2%" accessibilityLayer>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="label"
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            interval="preserveStartEnd"
            minTickGap={20}
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
            allowDecimals={false}
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            width={52}
            domain={model.startAtZero ? [0, 'auto'] : ['auto', 'auto']}
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
          <Bar
            dataKey="count"
            name="Count"
            fill={theme.palette[0]}
            stroke={theme.background}
            strokeWidth={1}
            isAnimationActive={!streaming}
          />
        </BarChart>
      </ChartSurface>
    </ChartFrame>
  );
}
