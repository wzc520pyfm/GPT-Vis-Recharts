import { useId } from 'react';
import type { LiquidModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { useReducedMotion } from '../hooks.js';
import { SvgSurface } from './SvgSurface.js';

function shapePath(shape: LiquidModel['shape']): string {
  if (shape === 'rect') {
    return 'M 45 70 Q 45 45 70 45 L 250 45 Q 275 45 275 70 L 275 185 Q 275 210 250 210 L 70 210 Q 45 210 45 185 Z';
  }
  if (shape === 'triangle') return 'M 160 28 L 286 218 L 34 218 Z';
  if (shape === 'pin') return 'M 160 25 C 90 25 45 78 45 135 C 45 195 160 235 160 235 C 160 235 275 195 275 135 C 275 78 230 25 160 25 Z';
  return 'M 160 36 A 124 124 0 1 1 159.8 36 Z';
}

export function LiquidView({ model }: { model: LiquidModel }) {
  const theme = model.theme;
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const clipId = `gvr-liquid-clip-${id}`;
  const path = shapePath(model.shape);
  const waterY = 220 - model.percent * 184;
  const wave = `M 20 ${waterY + 5} C 80 ${waterY - 8}, 120 ${waterY + 15}, 180 ${waterY + 2} S 280 ${waterY - 6}, 320 ${waterY + 4} L 320 260 L 20 260 Z`;
  const percentText = `${Math.round(model.percent * 100)}%`;
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme}>
      <SvgSurface
        title={model.title || 'Liquid gauge'}
        description={`${percentText} complete`}
        width={320}
        height={260}
        style={{ maxHeight: 420 }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
          <linearGradient id={`${clipId}-water`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.palette[0]} stopOpacity={0.95} />
            <stop offset="100%" stopColor={theme.palette[1] ?? theme.palette[0]} stopOpacity={0.72} />
          </linearGradient>
        </defs>
        <path d={path} fill={theme.grid} fillOpacity={0.5} stroke={theme.border} strokeWidth={1.2} />
        <g clipPath={`url(#${clipId})`}>
          <path d={wave} fill={`url(#${clipId}-water)`}>
            {!reduced && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -24 -3; 0 0"
                dur="5.5s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <path
            d={`M 0 ${waterY + 1} L 320 ${waterY + 1} L 320 260 L 0 260 Z`}
            fill={theme.palette[0]}
            fillOpacity={0.9}
          />
        </g>
        <path d={path} fill="none" stroke={theme.border} strokeWidth={1.5} />
        <text
          x={160}
          y={142}
          textAnchor="middle"
          fill={model.percent > 0.55 ? '#ffffff' : theme.text}
          fontFamily={theme.fontFamily}
          fontSize={40}
          fontWeight={700}
        >
          {percentText}
        </text>
      </SvgSurface>
    </ChartFrame>
  );
}
