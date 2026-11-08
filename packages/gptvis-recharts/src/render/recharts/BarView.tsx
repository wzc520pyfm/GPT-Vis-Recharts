import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BarModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import {
  axisLabelStyle,
  axisLine,
  axisTick,
  CARTESIAN_MARGIN,
  legendStyle,
  tooltipStyle,
  valueLabel,
} from './axis.js';

export function BarView({ model, streaming = false }: { model: BarModel; streaming?: boolean }) {
  const theme = model.theme;
  const horizontal = model.layout === 'vertical';
  const categoryAxis = (
    <YAxis
      type="category"
      dataKey="category"
      tick={axisTick(theme)}
      tickLine={false}
      axisLine={axisLine(theme)}
      width={horizontal ? 96 : 56}
      reversed={horizontal}
      interval={0}
    />
  );
  const valueAxis = (
    <YAxis
      type="number"
      tick={axisTick(theme)}
      tickLine={false}
      axisLine={axisLine(theme)}
      width={56}
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
  );

  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <BarChart
          data={model.data}
          layout={model.layout}
          margin={CARTESIAN_MARGIN}
          barCategoryGap={horizontal ? '20%' : '24%'}
          barGap={2}
          accessibilityLayer
        >
          <CartesianGrid
            stroke={theme.grid}
            strokeDasharray="3 5"
            horizontal={!horizontal}
            vertical={horizontal}
          />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={axisTick(theme)}
                tickLine={false}
                axisLine={axisLine(theme)}
                domain={model.startAtZero ? [0, 'auto'] : ['auto', 'auto']}
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
              {categoryAxis}
            </>
          ) : (
            <>
              <XAxis
                type="category"
                dataKey="category"
                tick={axisTick(theme)}
                tickLine={false}
                axisLine={axisLine(theme)}
                interval={0}
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
              {valueAxis}
            </>
          )}
          <Tooltip {...tooltipStyle(theme)} />
          {model.series.length > 1 && <Legend wrapperStyle={legendStyle(theme)} />}
          {model.series.map((series) => (
            <Bar
              key={series.key}
              dataKey={series.key}
              name={series.label}
              stackId={model.stacked ? 'stack' : undefined}
              fill={theme.palette[series.colorIndex % theme.palette.length]}
              radius={theme.radius > 0 ? [3, 3, 0, 0] : 0}
              maxBarSize={42}
              isAnimationActive={!streaming}
            >
              {model.showLabels && model.data.length <= 40 && (
                <LabelList
                  dataKey={series.key}
                  position={horizontal ? 'right' : 'top'}
                  style={valueLabel(theme)}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ChartSurface>
    </ChartFrame>
  );
}
