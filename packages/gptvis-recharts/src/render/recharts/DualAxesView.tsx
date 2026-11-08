import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DualAxesModel } from '../../build/types.js';
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

export function DualAxesView({
  model,
  streaming = false,
}: {
  model: DualAxesModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <ComposedChart data={model.data} margin={{ ...CARTESIAN_MARGIN, right: 30 }} accessibilityLayer>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="category"
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
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
            yAxisId="left"
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            width={56}
            domain={model.startAtZero ? [0, 'auto'] : ['auto', 'auto']}
            label={
              model.leftAxisTitle
                ? {
                    value: model.leftAxisTitle,
                    angle: -90,
                    position: 'insideLeft',
                    style: axisLabelStyle(theme),
                  }
                : undefined
            }
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            width={56}
            domain={model.startAtZero ? [0, 'auto'] : ['auto', 'auto']}
            label={
              model.rightAxisTitle
                ? {
                    value: model.rightAxisTitle,
                    angle: 90,
                    position: 'insideRight',
                    style: axisLabelStyle(theme),
                  }
                : undefined
            }
          />
          <Tooltip {...tooltipStyle(theme)} />
          <Legend wrapperStyle={legendStyle(theme)} />
          {model.series.map((series) => {
            const color = theme.palette[series.colorIndex % theme.palette.length];
            return series.type === 'column' ? (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                yAxisId={series.yAxisId}
                fill={color}
                fillOpacity={0.82}
                radius={theme.radius > 0 ? [3, 3, 0, 0] : 0}
                maxBarSize={42}
                isAnimationActive={!streaming}
              />
            ) : (
              <Line
                key={series.key}
                dataKey={series.key}
                name={series.label}
                yAxisId={series.yAxisId}
                type="monotone"
                stroke={color}
                strokeWidth={theme.lineWidth}
                dot={model.data.length <= 24 ? { r: 2.2, strokeWidth: 0 } : false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={!streaming}
              />
            );
          })}
        </ComposedChart>
      </ChartSurface>
    </ChartFrame>
  );
}
