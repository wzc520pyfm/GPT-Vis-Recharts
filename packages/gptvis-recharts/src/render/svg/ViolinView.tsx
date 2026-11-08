import type { DistributionModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgCartesianChart } from './SvgCartesianChart.js';

export function ViolinView({
  model,
}: {
  model: DistributionModel;
}) {
  const theme = model.theme;
  const values = model.groups.flatMap((group) => [group.low, group.high]);
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgCartesianChart
        title={model.title || 'Violin plot'}
        description={`Violin density for ${model.categories.join(', ')}`}
        theme={theme}
        xLabels={model.categories}
        yValues={values}
        xTitle={model.axisXTitle}
        yTitle={model.axisYTitle}
        includeZero={model.startAtZero}
      >
        {({ xBand, yScale }) => (
          <g>
            {model.groups.map((group) => {
              const categoryIndex = model.categories.indexOf(group.category);
              const groupIndex = model.series.indexOf(group.group);
              const groupCount = Math.max(1, model.series.length);
              const maxWidth = Math.min(46, (xBand.width / groupCount) * 0.82);
              const offset =
                groupCount === 1
                  ? 0
                  : (groupIndex - (groupCount - 1) / 2) * (xBand.width / groupCount);
              const centerX = xBand.center(categoryIndex) + offset;
              const color = theme.palette[group.colorIndex % theme.palette.length];
              const points = group.density.map((point) => ({
                x: centerX + (point.density * maxWidth) / 2,
                y: yScale(point.value),
              }));
              const leftPoints = [...points]
                .reverse()
                .map((point) => `${centerX - (point.x - centerX)},${point.y}`);
              const path = [
                `M ${centerX},${points[0]?.y ?? yScale(group.median)}`,
                ...points.map((point) => `L ${point.x},${point.y}`),
                ...leftPoints.map((point) => `L ${point}`),
                'Z',
              ].join(' ');
              return (
                <g key={`${group.category}-${group.group}`}>
                  <path
                    d={path}
                    fill={color}
                    fillOpacity={0.28}
                    stroke={color}
                    strokeWidth={1.2}
                  >
                    <title>
                      {`${group.category} ${group.group}: median ${group.median}`}
                    </title>
                  </path>
                  <line
                    x1={centerX - maxWidth * 0.18}
                    x2={centerX + maxWidth * 0.18}
                    y1={yScale(group.median)}
                    y2={yScale(group.median)}
                    stroke={color}
                    strokeWidth={2}
                  />
                  <circle
                    cx={centerX}
                    cy={yScale(group.q1)}
                    r={2}
                    fill={theme.background}
                    stroke={color}
                  />
                  <circle
                    cx={centerX}
                    cy={yScale(group.q3)}
                    r={2}
                    fill={theme.background}
                    stroke={color}
                  />
                </g>
              );
            })}
          </g>
        )}
      </SvgCartesianChart>
    </ChartFrame>
  );
}
