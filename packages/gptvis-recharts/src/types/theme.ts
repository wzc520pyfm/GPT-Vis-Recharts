export type ThemeName =
  | 'default'
  | 'light'
  | 'dark'
  | 'academy'
  | 'gpt-vis'
  | 'midnight'
  | 'paper'
  | 'product'
  | 'neon-circuit'
  | 'terra-print'
  | 'mono-signal'
  | 'candy-pop'
  | 'pop'
  | 'bauhaus';

export interface ThemeTokens {
  colorDefault?: string;
  colorBackground?: string;
  colorSurface?: string;
  colorText?: string;
  colorTextSecondary?: string;
  colorTextInverse?: string;
  colorStroke?: string;
  colorPositive?: string;
  colorNegative?: string;
  colorNeutral?: string;
  category10?: string[];
  category20?: string[];
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | 'normal' | 'bold';
  lineHeight?: number;
  spacingSmall?: number;
  spacingMedium?: number;
  lineWidth?: number;
  radius?: number;
}

export interface ThemeStyle {
  backgroundColor?: string;
  palette?: string[];
  title?: Record<string, unknown>;
  axis?: Record<string, unknown>;
  legend?: Record<string, unknown>;
  label?: Record<string, unknown>;
  mark?: Record<string, unknown>;
  node?: Record<string, unknown>;
  edge?: Record<string, unknown>;
  table?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  texture?: 'rough' | 'default';
  lineWidth?: number;
  startAtZero?: boolean;
  [key: string]: unknown;
}

export interface ThemeSpec {
  id: string;
  label: string;
  description?: string;
  baseTheme?: string;
  tokens?: ThemeTokens;
  style?: ThemeStyle;
  charts?: Partial<Record<string, { style?: ThemeStyle }>>;
}

export type VisualizationTheme = ThemeName | ThemeSpec;

export interface ResolvedTheme {
  name: ThemeName;
  background: string;
  text: string;
  muted: string;
  grid: string;
  border: string;
  tooltipBg: string;
  tooltipText: string;
  palette: string[];
  positive: string;
  negative: string;
  total: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  radius: number;
  spacing: number;
  lineWidth: number;
}

export interface VisualizationOptions {
  container: string | HTMLElement;
  width?: number;
  height?: number;
  theme?: VisualizationTheme;
  streaming?: boolean;
  wrapper?: boolean;
  locale?: string;
  onStatus?: (status: RenderStatus) => void;
}

export interface RenderStatus {
  state: 'pending' | 'ready' | 'unsupported' | 'error';
  message: string;
}
