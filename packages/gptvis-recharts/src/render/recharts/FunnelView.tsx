import { Cell, Funnel, FunnelChart, LabelList, Tooltip } from 'recharts';
import type { FunnelModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import { tooltipStyle, valueLabel } from './axis.js';

export function FunnelView({
  model,
  streaming = false,
}: {
  model: FunnelModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  const data = model.data.map((item, index) => ({
    ...item,
    fill: theme.palette[index % theme.palette.length],
  }));
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <FunnelChart margin={{ top: 12, right: 120, bottom: 12, left: 16 }} accessibilityLayer>
          <Tooltip {...tooltipStyle(theme)} />
          <Funnel
            data={data}
            dataKey="value"
            nameKey="name"
            isAnimationActive={!streaming}
            stroke={theme.background}
            strokeWidth={2}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.fill} />
            ))}
            <LabelList
              position="right"
              dataKey="name"
              style={{ ...valueLabel(theme), fill: theme.text, fontSize: 11 }}
            />
            <LabelList
              position="inside"
              dataKey="value"
              style={{ ...valueLabel(theme), fill: '#ffffff', fontSize: 11 }}
            />
          </Funnel>
        </FunnelChart>
      </ChartSurface>
    </ChartFrame>
  );
}
