import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

export function LineView({ model, streaming = false }: { model: LineModel; streaming?: boolean }) {
  const theme = model.theme;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <LineChart data={model.data} margin={CARTESIAN_MARGIN} accessibilityLayer>
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
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.label}
              stroke={theme.palette[series.colorIndex % theme.palette.length]}
              strokeWidth={theme.lineWidth}
              dot={model.data.length <= 24 ? { r: 2.2, strokeWidth: 0 } : false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={!streaming}
            />
          ))}
        </LineChart>
      </ChartSurface>
    </ChartFrame>
  );
}
