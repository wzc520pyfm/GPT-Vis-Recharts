import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ResolvedTheme } from '../types/theme.js';
import { downloadSvg } from './download.js';
import { wrapperLabels } from './locale.js';

export interface ChartWrapperProps {
  theme: ResolvedTheme;
  locale?: string;
  source: string;
  canDownload: boolean;
  zoomable: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  chartType?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

async function copySource(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to a local selection-based fallback.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function ToolButton({
  label,
  onClick,
  children,
  pressed = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed || undefined}
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        padding: '4px 7px',
        borderRadius: 5,
        cursor: 'pointer',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

export function ChartWrapper({
  theme,
  locale,
  source,
  canDownload,
  zoomable,
  zoom,
  onZoomChange,
  chartType,
  className,
  style,
  children,
}: ChartWrapperProps) {
  const labels = wrapperLabels(locale);
  const [tab, setTab] = useState<'chart' | 'source'>('chart');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const chartHostRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    if (!(await copySource(source))) return;
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1200);
  };

  const handleDownload = () => {
    downloadSvg(
      chartHostRef.current,
      `chart-${chartType || 'vis'}-${Date.now()}`,
      theme.background,
    );
  };

  const zoomOut = () => onZoomChange(Math.max(0.1, zoom / 1.15));
  const zoomIn = () => onZoomChange(Math.min(5, zoom * 1.15));

  const headerButtonStyle: CSSProperties = {
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    padding: '4px 9px',
    background: theme.background,
    cursor: 'pointer',
    fontFamily: theme.fontFamily,
    fontSize: 11,
  };

  return (
    <section
      className={className ? `gvr-wrapper ${className}` : 'gvr-wrapper'}
      aria-label={labels.chartLabel}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: theme.background,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        color: theme.text,
        fontFamily: theme.fontFamily,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <header
        style={{
          flex: '0 0 auto',
          minHeight: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '5px 8px',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.background,
        }}
      >
        <div role="tablist" aria-label={labels.chartLabel} style={{ display: 'flex', gap: 2 }}>
          {(['chart', 'source'] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              aria-controls={`gvr-panel-${item}`}
              onClick={() => setTab(item)}
              style={{
                appearance: 'none',
                border: 0,
                borderBottom: `2px solid ${tab === item ? theme.total : 'transparent'}`,
                background: 'transparent',
                color: tab === item ? theme.text : theme.muted,
                padding: '7px 9px 5px',
                cursor: 'pointer',
                fontFamily: theme.fontFamily,
                fontSize: 12,
                fontWeight: tab === item ? 650 : 500,
              }}
            >
              {item === 'chart' ? labels.chartTab : labels.sourceTab}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {tab === 'chart' && zoomable && (
            <>
              <ToolButton label={labels.zoomOut} onClick={zoomOut}>
                −
              </ToolButton>
              <ToolButton label={labels.zoomReset} onClick={() => onZoomChange(1)}>
                {`${Math.round(zoom * 100)}%`}
              </ToolButton>
              <ToolButton label={labels.zoomIn} onClick={zoomIn}>
                +
              </ToolButton>
            </>
          )}
          {tab === 'chart' ? (
            canDownload && (
              <button type="button" onClick={handleDownload} style={headerButtonStyle}>
                {labels.download}
              </button>
            )
          ) : (
            <button type="button" onClick={handleCopy} style={headerButtonStyle}>
              {copied ? labels.copied : labels.copy}
            </button>
          )}
        </div>
      </header>
      <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 220, overflow: 'hidden' }}>
        <div
          id="gvr-panel-chart"
          role="tabpanel"
          aria-hidden={tab !== 'chart'}
          style={{
            position: 'absolute',
            inset: 0,
            visibility: tab === 'chart' ? 'visible' : 'hidden',
            pointerEvents: tab === 'chart' ? 'auto' : 'none',
          }}
        >
          <div ref={chartHostRef} style={{ width: '100%', height: '100%' }}>
            {children}
          </div>
        </div>
        <div
          id="gvr-panel-source"
          role="tabpanel"
          hidden={tab !== 'source'}
          style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: 12 }}
        >
          <pre
            style={{
              margin: 0,
              color: theme.text,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            {source}
          </pre>
        </div>
      </div>
    </section>
  );
}
