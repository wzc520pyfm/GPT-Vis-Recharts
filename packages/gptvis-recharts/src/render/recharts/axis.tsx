import type { CSSProperties } from 'react';
import type { ResolvedTheme } from '../../types/theme.js';

export const CARTESIAN_MARGIN = { top: 12, right: 22, bottom: 12, left: 10 };

export function axisTick(theme: ResolvedTheme) {
  return { fill: theme.muted, fontSize: 11, fontFamily: theme.fontFamily };
}

export function axisLine(theme: ResolvedTheme) {
  return { stroke: theme.border };
}

export function axisLabelStyle(theme: ResolvedTheme): CSSProperties {
  return { fill: theme.muted, fontSize: 11, fontFamily: theme.fontFamily };
}

export function tooltipStyle(theme: ResolvedTheme) {
  return {
    contentStyle: {
      background: theme.tooltipBg,
      color: theme.tooltipText,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius,
      boxShadow: '0 8px 24px rgba(0,0,0,.14)',
      fontFamily: theme.fontFamily,
      fontSize: 12,
      padding: '8px 10px',
    },
    itemStyle: { color: theme.tooltipText },
    labelStyle: { color: theme.tooltipText, fontWeight: 600, marginBottom: 4 },
  };
}

export function legendStyle(theme: ResolvedTheme): CSSProperties {
  return {
    color: theme.text,
    fontFamily: theme.fontFamily,
    fontSize: 11,
    paddingTop: 4,
  };
}

export function valueLabel(theme: ResolvedTheme) {
  return {
    fill: theme.muted,
    fontSize: 10,
    fontFamily: theme.fontFamily,
  };
}
