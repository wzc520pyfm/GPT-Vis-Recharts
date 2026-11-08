import type { VennModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { SvgSurface } from './SvgSurface.js';

function circlePositions(count: number): Array<{ x: number; y: number; r: number }> {
  if (count <= 1) return [{ x: 400, y: 210, r: 145 }];
  if (count === 2) {
    return [
      { x: 320, y: 210, r: 150 },
      { x: 480, y: 210, r: 150 },
    ];
  }
  return [
    { x: 400, y: 145, r: 140 },
    { x: 330, y: 270, r: 140 },
    { x: 470, y: 270, r: 140 },
  ];
}

function regionPosition(sets: string[], count: number): { x: number; y: number } {
  const key = [...sets].sort().join('∩');
  if (count === 1) return { x: 400, y: 210 };
  if (count === 2) {
    if (key.length === 1) return { x: key === 'A' ? 300 : 500, y: 210 };
    return { x: 400, y: 210 };
  }
  const positions: Record<string, { x: number; y: number }> = {
    A: { x: 400, y: 105 },
    B: { x: 300, y: 292 },
    C: { x: 500, y: 292 },
    'A∩B': { x: 350, y: 220 },
    'A∩C': { x: 450, y: 220 },
    'B∩C': { x: 400, y: 305 },
    'A∩B∩C': { x: 400, y: 245 },
  };
  return positions[key] ?? { x: 400, y: 210 };
}

export function VennView({ model }: { model: VennModel }) {
  const theme = model.theme;
  const positions = circlePositions(Math.max(1, model.sets.length));
  const setLabels = model.sets.map((set, index) => ({
    set,
    x: index === 0 && model.sets.length === 2 ? 240 : index === 1 && model.sets.length === 2 ? 560 : positions[index]?.x ?? 400,
    y:
      model.sets.length === 3
        ? index === 0
          ? 45
          : 390
        : 50,
  }));
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface
        title={model.title || 'Venn diagram'}
        description={model.regions.map((region) => `${region.label}: ${region.value}`).join('; ')}
      >
        {model.sets.length > 1 &&
          positions.map((circle, index) => {
            const color = theme.palette[index % theme.palette.length];
            return (
              <circle
                key={model.sets[index]}
                cx={circle.x}
                cy={circle.y}
                r={circle.r}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeWidth={1.6}
                style={{ mixBlendMode: 'multiply' }}
              />
            );
          })}
        {model.sets.length === 1 && (
          <circle
            cx={positions[0]?.x ?? 400}
            cy={positions[0]?.y ?? 210}
            r={positions[0]?.r ?? 145}
            fill={theme.palette[0]}
            fillOpacity={0.2}
            stroke={theme.palette[0]}
            strokeWidth={1.6}
          />
        )}
        {setLabels.map((label) => (
          <text
            key={label.set}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fill={theme.text}
            fontFamily={theme.fontFamily}
            fontSize={14}
            fontWeight={650}
          >
            {label.set}
          </text>
        ))}
        {model.regions.map((region) => {
          const position = regionPosition(region.sets, model.sets.length);
          return (
            <g key={`${region.sets.join('-')}-${region.label}`}>
              <text
                x={position.x}
                y={position.y}
                textAnchor="middle"
                fill={theme.text}
                fontFamily={theme.fontFamily}
                fontSize={12}
                fontWeight={600}
              >
                {region.label}
              </text>
              <text
                x={position.x}
                y={position.y + 15}
                textAnchor="middle"
                fill={theme.muted}
                fontFamily={theme.fontFamily}
                fontSize={10}
              >
                {region.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </SvgSurface>
    </ChartFrame>
  );
}
