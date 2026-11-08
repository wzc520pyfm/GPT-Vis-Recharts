import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { buildView } from './build/index.js';
import type { ChartModel } from './build/types.js';
import type { VisualizationInput } from './types/charts.js';
import {
  VisRenderer,
  isChartModelEmpty,
  isZoomableChart,
} from './render/VisRenderer.js';
import { resolveTheme } from './theme/resolve.js';
import type {
  RenderStatus,
  VisualizationTheme,
} from './types/theme.js';
import { ChartWrapper } from './wrapper/Wrapper.js';

export interface GPTVisChartProps {
  content: VisualizationInput;
  theme?: VisualizationTheme;
  streaming?: boolean;
  wrapper?: boolean;
  locale?: string;
  className?: string;
  style?: CSSProperties;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onStatus?: (status: RenderStatus) => void;
}

const HTML_ONLY = new Set<ChartModel['type']>(['table', 'summary', 'indented-tree']);

function canDownloadModel(model: ChartModel): boolean {
  return !HTML_ONLY.has(model.type);
}

function stringifyInput(input: VisualizationInput): string {
  if (typeof input === 'string') return input;
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return '[unserializable input]';
  }
}

export function VisChart({
  content,
  theme,
  streaming = false,
  wrapper = false,
  locale = 'en-US',
  className,
  style,
  zoom: controlledZoom,
  onZoomChange,
  onStatus,
}: GPTVisChartProps) {
  const view = useMemo(
    () => buildView(content, { theme, streaming, locale }),
    [content, theme, streaming, locale],
  );
  const [internalZoom, setInternalZoom] = useState(1);
  const zoom = controlledZoom ?? internalZoom;
  const lastStatus = useRef<string>('');

  useEffect(() => {
    if (!onStatus) return;
    const status: RenderStatus =
      view.kind === 'ready'
        ? { state: 'ready', message: '' }
        : { state: view.kind, message: view.message };
    const key = `${status.state}\u0000${status.message}`;
    if (key === lastStatus.current) return;
    lastStatus.current = key;
    onStatus(status);
  }, [onStatus, view]);

  const handleZoomChange = (next: number) => {
    const safe = Math.max(0.1, Math.min(5, next));
    if (controlledZoom === undefined) setInternalZoom(safe);
    onZoomChange?.(safe);
  };

  const statusTheme = view.kind === 'ready' ? view.model.theme : resolveTheme(theme);
  const rendered = (
    <VisRenderer
      view={view}
      theme={statusTheme}
      streaming={streaming}
      zoom={zoom}
      className={wrapper ? undefined : className}
      style={wrapper ? undefined : style}
    />
  );

  if (!wrapper) return rendered;

  const canDownload =
    view.kind === 'ready' &&
    !isChartModelEmpty(view.model) &&
    canDownloadModel(view.model);

  return (
    <ChartWrapper
      theme={statusTheme}
      locale={locale}
      source={stringifyInput(content)}
      canDownload={canDownload}
      zoomable={
        view.kind === 'ready' &&
        !isChartModelEmpty(view.model) &&
        isZoomableChart(view.model.type)
      }
      zoom={zoom}
      onZoomChange={handleZoomChange}
      chartType={view.kind === 'ready' ? view.model.type : undefined}
      className={className}
      style={style}
    >
      {rendered}
    </ChartWrapper>
  );
}

export const GPTVisChart = VisChart;
