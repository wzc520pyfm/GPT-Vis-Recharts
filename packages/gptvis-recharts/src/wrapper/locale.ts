export interface WrapperLabels {
  chartTab: string;
  sourceTab: string;
  copy: string;
  copied: string;
  download: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  chartLabel: string;
}

const LABELS: Record<'en-US' | 'zh-CN', WrapperLabels> = {
  'en-US': {
    chartTab: 'Chart',
    sourceTab: 'Source',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomReset: 'Reset zoom',
    chartLabel: 'Chart',
  },
  'zh-CN': {
    chartTab: '图表',
    sourceTab: '源码',
    copy: '复制',
    copied: '已复制',
    download: '下载',
    zoomIn: '放大',
    zoomOut: '缩小',
    zoomReset: '重置缩放',
    chartLabel: '图表',
  },
};

export function localeKey(locale: string | undefined): 'en-US' | 'zh-CN' {
  return locale?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

export function wrapperLabels(locale: string | undefined): WrapperLabels {
  return LABELS[localeKey(locale)];
}
