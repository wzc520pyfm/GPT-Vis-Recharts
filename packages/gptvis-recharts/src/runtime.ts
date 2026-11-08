import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { VisChart } from './react.js';
import type { BoundGPTVis, VisualizationInput } from './types/charts.js';
import type { VisualizationOptions } from './types/theme.js';

function resolveContainer(container: string | HTMLElement): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('GPTVis requires a browser DOM. Render GPTVisChart on the server instead.');
  }
  if (typeof container !== 'string') return container;
  const element = document.querySelector<HTMLElement>(container);
  if (!element) throw new Error(`Container element not found: ${container}`);
  return element;
}

function dimension(value: number | undefined): string | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `${value}px`
    : undefined;
}

export class GPTVis {
  private readonly options: VisualizationOptions;
  private readonly container: HTMLElement;
  private readonly host: HTMLElement;
  private readonly root: Root;
  private resizeObserver: ResizeObserver | null = null;
  private content: VisualizationInput = '';
  private zoom = 1;
  private destroyed = false;

  constructor(options: VisualizationOptions) {
    if (!options || options.container === undefined || options.container === null) {
      throw new Error('GPTVis requires a container option.');
    }
    this.options = { ...options };
    this.container = resolveContainer(options.container);
    this.host = document.createElement('div');
    this.host.className = 'gvr-runtime-host';
    this.host.style.width = dimension(options.width) ?? '100%';
    this.host.style.height = dimension(options.height) ?? '100%';
    this.host.style.minHeight = dimension(options.height) ?? '280px';
    this.host.style.boxSizing = 'border-box';
    this.container.replaceChildren(this.host);
    this.root = createRoot(this.host);

    if ((!options.width || !options.height) && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (!options.width && width > 0) this.host.style.width = `${width}px`;
        if (!options.height && height > 0) this.host.style.height = `${height}px`;
      });
      this.resizeObserver.observe(this.container);
    }
  }

  render(input: VisualizationInput): void {
    if (this.destroyed) throw new Error('GPTVis has been destroyed.');
    this.content = input;
    this.renderRoot();
  }

  resize(): void {
    if (this.destroyed) return;
    this.renderRoot();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  zoomTo(zoom: number): void {
    if (this.destroyed) return;
    this.zoom = Math.max(0.1, Math.min(5, Number.isFinite(zoom) ? zoom : 1));
    this.renderRoot();
  }

  getZoom(): number {
    return this.zoom;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.root.unmount();
    this.host.remove();
  }

  private renderRoot(): void {
    this.root.render(
      createElement(VisChart, {
        content: this.content,
        theme: this.options.theme,
        streaming: this.options.streaming,
        wrapper: this.options.wrapper,
        locale: this.options.locale,
        zoom: this.zoom,
        onZoomChange: (zoom: number) => {
          this.zoom = zoom;
          this.renderRoot();
        },
        onStatus: (status) => {
          try {
            this.options.onStatus?.(status);
          } catch {
            // Consumer callbacks must not break the chart runtime.
          }
        },
      }),
    );
  }
}

export interface BindGPTVisOptions extends Omit<VisualizationOptions, 'container'> {}

export function bindGPTVis(
  container: string | HTMLElement,
  options: BindGPTVisOptions = {},
): BoundGPTVis {
  const instance = new GPTVis({ ...options, container });
  return {
    update: (content) => instance.render(content),
    resize: () => instance.resize(),
    destroy: () => instance.destroy(),
  };
}
