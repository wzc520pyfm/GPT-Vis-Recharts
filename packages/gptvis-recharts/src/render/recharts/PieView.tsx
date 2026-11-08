import { Cell, Legend, Pie, PieChart, Tooltip } from 'recharts';
import type { PieModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import { legendStyle, tooltipStyle } from './axis.js';

export function PieView({ model, streaming = false }: { model: PieModel; streaming?: boolean }) {
  const theme = model.theme;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }} accessibilityLayer>
          <Tooltip {...tooltipStyle(theme)} />
          <Legend wrapperStyle={legendStyle(theme)} />
          <Pie
            data={model.data}
            dataKey="value"
            nameKey="name"
            innerRadius={`${Math.round(model.innerRadius * 42)}%`}
            outerRadius="72%"
            paddingAngle={1.5}
            stroke={theme.background}
            strokeWidth={2}
            label
            labelLine={{ stroke: theme.border }}
            isAnimationActive={!streaming}
          >
            {model.data.map((item) => (
              <Cell
                key={item.name}
                fill={theme.palette[item.colorIndex % theme.palette.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ChartSurface>
    </ChartFrame>
  );
}
