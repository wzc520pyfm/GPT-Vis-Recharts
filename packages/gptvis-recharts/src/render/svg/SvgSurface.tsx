import type { CSSProperties, ReactNode } from 'react';

export interface SvgSurfaceProps {
  title: string;
  description?: string;
  width?: number;
  height?: number;
  children: ReactNode;
  style?: CSSProperties;
}

export function SvgSurface({
  title,
  description,
  width = 800,
  height = 420,
  children,
  style,
}: SvgSurfaceProps) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        minHeight: 220,
        overflow: 'visible',
        ...style,
      }}
    >
      <title>{title}</title>
      {description && <desc>{description}</desc>}
      {children}
    </svg>
  );
}
