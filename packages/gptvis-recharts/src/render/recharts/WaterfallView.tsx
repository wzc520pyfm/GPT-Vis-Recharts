import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WaterfallModel, WaterfallRow } from '../../build/types.js';
import type { ResolvedTheme } from '../../types/theme.js';
import { ChartFrame } from '../Frame.js';
import { ChartSurface } from './ChartSurface.js';
import {
  axisLabelStyle,
  axisLine,
  axisTick,
  CARTESIAN_MARGIN,
  tooltipStyle,
  valueLabel,
} from './axis.js';

interface WaterfallTooltipPayload {
  payload?: WaterfallRow;
}

function WaterfallTooltip({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: ReadonlyArray<WaterfallTooltipPayload>;
  theme: ResolvedTheme;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div
      style={{
        ...tooltipStyle(theme).contentStyle,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 3 }}>{row.category}</div>
      <div>
        {row.kind === 'total' ? 'Total' : row.value >= 0 ? '+' : ''}
        {row.value.toLocaleString()}
      </div>
    </div>
  );
}

function colorFor(row: WaterfallRow, theme: ResolvedTheme): string {
  if (row.kind === 'total') return theme.total;
  if (row.kind === 'intermediate') return theme.muted;
  return row.kind === 'negative' ? theme.negative : theme.positive;
}

export function WaterfallView({
  model,
  streaming = false,
}: {
  model: WaterfallModel;
  streaming?: boolean;
}) {
  const theme = model.theme;
  const data = model.data.map((row) => ({ ...row, valueForLabel: row.value }));
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <ChartSurface>
        <BarChart data={data} margin={{ ...CARTESIAN_MARGIN, right: 28 }} accessibilityLayer>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="category"
            tick={axisTick(theme)}
            tickLine={false}
            axisLine={axisLine(theme)}
            interval={0}
            angle={data.length > 6 ? -25 : 0}
            textAnchor={data.length > 6 ? 'end' : 'middle'}
            height={data.length > 6 ? 56 : 30}
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
          <Tooltip
            content={(props) => (
              <WaterfallTooltip
                active={props.active}
                payload={props.payload as ReadonlyArray<WaterfallTooltipPayload> | undefined}
                theme={theme}
              />
            )}
          />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
          <Bar
            dataKey="size"
            stackId="waterfall"
            name="Value"
            radius={theme.radius > 0 ? [3, 3, 0, 0] : 0}
            maxBarSize={54}
            isAnimationActive={!streaming}
          >
            {data.map((row) => (
              <Cell key={row.category} fill={colorFor(row, theme)} />
            ))}
            <LabelList
              dataKey="valueForLabel"
              position="top"
              style={valueLabel(theme)}
              formatter={(value: unknown) =>
                typeof value === 'number' ? value.toLocaleString() : String(value ?? '')
              }
            />
          </Bar>
        </BarChart>
      </ChartSurface>
    </ChartFrame>
  );
}
