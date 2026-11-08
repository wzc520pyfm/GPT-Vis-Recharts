import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from 'recharts';
import type { RadarModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import { axisTick, legendStyle, tooltipStyle } from './axis.js';

export function RadarView({ model, streaming = false }: { model: RadarModel; streaming?: boolean }) {
  const theme = model.theme;
  const data = model.indicators.map((indicator, index) => {
    const row: Record<string, string | number> = { name: indicator };
    for (const [seriesIndex, series] of model.series.entries()) {
      row[`series_${seriesIndex}`] = series.values[index] ?? 0;
    }
    return row;
  });
  const max = Math.max(
    1,
    ...model.series.flatMap((series) => series.values).filter(Number.isFinite),
  );
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <RadarChart data={data} outerRadius="72%" margin={{ top: 12, right: 36, bottom: 8, left: 36 }}>
          <PolarGrid stroke={theme.grid} />
          <PolarAngleAxis dataKey="name" tick={axisTick(theme)} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, Math.ceil(max * 1.08)]}
            tick={axisTick(theme)}
            axisLine={false}
          />
          <Tooltip {...tooltipStyle(theme)} />
          {model.series.length > 1 && <Legend wrapperStyle={legendStyle(theme)} />}
          {model.series.map((series, index) => {
            const color = theme.palette[series.colorIndex % theme.palette.length];
            return (
              <Radar
                key={series.name}
                name={series.name}
                dataKey={`series_${index}`}
                stroke={color}
                fill={color}
                fillOpacity={0.16}
                strokeWidth={theme.lineWidth}
                isAnimationActive={!streaming}
              />
            );
          })}
        </RadarChart>
      </ChartSurface>
    </ChartFrame>
  );
}
