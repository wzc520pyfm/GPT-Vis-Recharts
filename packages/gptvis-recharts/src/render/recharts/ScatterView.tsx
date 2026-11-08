import {
  CartesianGrid,
  Legend,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { ScatterModel } from '../../build/types.js';
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

export function ScatterView({
  model,
  streaming = false,
}: {
  model: ScatterModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <ScatterChart margin={CARTESIAN_MARGIN} accessibilityLayer>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 5" />
          <XAxis
            type="number"
            dataKey="x"
            name={model.axisXTitle || 'x'}
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
            type="number"
            dataKey="y"
            name={model.axisYTitle || 'y'}
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
          <ZAxis range={[42, 42]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tooltipStyle(theme)} />
          {model.series.length > 1 && <Legend wrapperStyle={legendStyle(theme)} />}
          {model.series.map((series) => (
            <Scatter
              key={series.name}
              name={series.name}
              data={series.points}
              fill={theme.palette[series.colorIndex % theme.palette.length]}
              fillOpacity={0.82}
              isAnimationActive={!streaming}
            />
          ))}
        </ScatterChart>
      </ChartSurface>
    </ChartFrame>
  );
}
