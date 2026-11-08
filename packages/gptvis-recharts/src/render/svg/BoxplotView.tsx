import type { DistributionModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgCartesianChart } from './SvgCartesianChart.js';

export function BoxplotView({
  model,
}: {
  model: DistributionModel;
}) {
  const theme = model.theme;
  const values = model.groups.flatMap((group) => [
    group.low,
    group.high,
    ...group.outliers,
  ]);
  const description = `Boxplot for ${model.categories.join(', ')}`;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgCartesianChart
        title={model.title || 'Boxplot'}
        description={description}
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
              const boxWidth = Math.min(38, (xBand.width / groupCount) * 0.72);
              const offset =
                groupCount === 1
                  ? 0
                  : (groupIndex - (groupCount - 1) / 2) * (xBand.width / groupCount);
              const centerX = xBand.center(categoryIndex) + offset;
              const color = theme.palette[group.colorIndex % theme.palette.length];
              const q1 = yScale(group.q1);
              const q3 = yScale(group.q3);
              const top = Math.min(q1, q3);
              const height = Math.max(1, Math.abs(q1 - q3));
              return (
                <g key={`${group.category}-${group.group}`}>
                  <line
                    x1={centerX}
                    x2={centerX}
                    y1={yScale(group.high)}
                    y2={yScale(group.low)}
                    stroke={color}
                    strokeWidth={1.2}
                  />
                  <line
                    x1={centerX - boxWidth * 0.25}
                    x2={centerX + boxWidth * 0.25}
                    y1={yScale(group.high)}
                    y2={yScale(group.high)}
                    stroke={color}
                    strokeWidth={1.2}
                  />
                  <line
                    x1={centerX - boxWidth * 0.25}
                    x2={centerX + boxWidth * 0.25}
                    y1={yScale(group.low)}
                    y2={yScale(group.low)}
                    stroke={color}
                    strokeWidth={1.2}
                  />
                  <rect
                    x={centerX - boxWidth / 2}
                    y={top}
                    width={boxWidth}
                    height={height}
                    fill={color}
                    fillOpacity={0.22}
                    stroke={color}
                    strokeWidth={1.4}
                    rx={2}
                  >
                    <title>
                      {`${group.category} ${group.group}: q1 ${group.q1}, median ${group.median}, q3 ${group.q3}`}
                    </title>
                  </rect>
                  <line
                    x1={centerX - boxWidth / 2}
                    x2={centerX + boxWidth / 2}
                    y1={yScale(group.median)}
                    y2={yScale(group.median)}
                    stroke={color}
                    strokeWidth={2.2}
                  />
                  {group.outliers.map((outlier) => (
                    <circle
                      key={outlier}
                      cx={centerX}
                      cy={yScale(outlier)}
                      r={2.4}
                      fill={theme.background}
                      stroke={color}
                      strokeWidth={1}
                    >
                      <title>{`Outlier: ${outlier}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </g>
        )}
      </SvgCartesianChart>
    </ChartFrame>
  );
}
