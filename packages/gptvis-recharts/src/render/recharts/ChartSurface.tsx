import type { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

export interface ChartSurfaceProps {
  children: ReactNode;
  minHeight?: number;
}

export function ChartSurface({ children, minHeight = 220 }: ChartSurfaceProps) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight, position: 'relative' }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={minHeight}
        initialDimension={{ width: 640, height: Math.max(minHeight, 320) }}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}
