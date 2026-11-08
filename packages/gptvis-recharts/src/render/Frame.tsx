import type { CSSProperties, ReactNode } from 'react';
import type { ResolvedTheme } from '../types/theme.js';

export interface ChartFrameProps {
  title?: string;
  subtitle?: string;
  theme: ResolvedTheme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function ChartFrame({
  title,
  subtitle,
  theme,
  children,
  className,
  style,
  bodyStyle,
}: ChartFrameProps) {
  return (
    <section
      className={className ? `gvr-frame ${className}` : 'gvr-frame'}
      aria-label={title || 'Visualization'}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 280,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px 10px',
        background: theme.background,
        color: theme.text,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        lineHeight: theme.lineHeight,
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || subtitle) && (
        <header style={{ flex: '0 0 auto', marginBottom: 8 }}>
          {title && (
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.35,
                fontWeight: 650,
                color: theme.text,
                letterSpacing: 0,
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                margin: title ? '4px 0 0' : 0,
                fontSize: 12,
                lineHeight: 1.45,
                color: theme.muted,
              }}
            >
              {subtitle}
            </p>
          )}
        </header>
      )}
      <div
        className="gvr-frame-body"
        style={{
          flex: '1 1 auto',
          minHeight: 220,
          position: 'relative',
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </section>
  );
}
