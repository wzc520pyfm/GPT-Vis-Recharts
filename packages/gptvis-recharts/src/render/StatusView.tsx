import type { ResolvedTheme } from '../types/theme.js';
import { ChartFrame } from './Frame.js';

export interface StatusViewProps {
  state: 'pending' | 'unsupported' | 'error' | 'empty';
  message: string;
  title?: string;
  subtitle?: string;
  theme: ResolvedTheme;
}

export function StatusView({ state, message, title, subtitle, theme }: StatusViewProps) {
  const glyph = state === 'pending' ? '···' : state === 'empty' ? '∅' : '!';
  return (
    <ChartFrame title={title} subtitle={subtitle} theme={theme}>
      <div
        role={state === 'error' || state === 'unsupported' ? 'alert' : 'status'}
        aria-live="polite"
        style={{
          height: '100%',
          minHeight: 220,
          display: 'grid',
          placeItems: 'center',
          alignContent: 'center',
          gap: 8,
          textAlign: 'center',
          color: theme.muted,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: `${theme.grid}cc`,
            color: state === 'error' || state === 'unsupported' ? theme.negative : theme.muted,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {glyph}
        </span>
        <p style={{ margin: 0, maxWidth: 420, lineHeight: 1.55 }}>{message}</p>
      </div>
    </ChartFrame>
  );
}
