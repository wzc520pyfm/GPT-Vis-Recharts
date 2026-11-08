import type {
  ResolvedTheme,
  ThemeName,
  ThemeSpec,
  ThemeStyle,
  ThemeTokens,
  VisualizationTheme,
} from '../types/theme.js';
import { mergeObjects } from './merge.js';
import { THEME_NAMES, THEME_PRESETS } from './presets.js';

const COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\(\s*[\d.%\s,/+-]+\)|hsla?\(\s*[\d.%\s,/+-]+\)|[a-z]{3,24})$/i;
const FONT = /^[\w\s"'.,-]{1,160}$/;

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as string[]).includes(value);
}

export function isThemeSpec(value: unknown): value is ThemeSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const spec = value as Partial<ThemeSpec>;
  return typeof spec.id === 'string' || typeof spec.label === 'string';
}

export function safeColor(value: unknown, fallback?: string): string | undefined {
  if (typeof value !== 'string') return fallback;
  const color = value.trim();
  return COLOR.test(color) ? color : fallback;
}

export function safePalette(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const colors = value.map((item) => safeColor(item)).filter((item): item is string => Boolean(item));
  return colors.length ? colors : fallback;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function fontFamily(value: unknown, fallback: string): string {
  return typeof value === 'string' && FONT.test(value.trim()) ? value.trim() : fallback;
}

export function resolveTheme(
  theme: unknown,
  fallback: VisualizationTheme = 'default',
): ResolvedTheme {
  const selected = isThemeName(theme) || isThemeSpec(theme) ? theme : fallback;
  if (isThemeSpec(selected)) {
    const baseName = isThemeName(selected.baseTheme) ? selected.baseTheme : 'default';
    return applyThemeSpec(THEME_PRESETS[baseName], selected);
  }
  return { ...THEME_PRESETS[selected] };
}

function applyThemeSpec(base: ResolvedTheme, spec: ThemeSpec): ResolvedTheme {
  const tokens: ThemeTokens = spec.tokens ?? {};
  const style: ThemeStyle = spec.style ?? {};
  const next: ResolvedTheme = {
    ...base,
    background: safeColor(tokens.colorBackground, base.background) ?? base.background,
    text: safeColor(tokens.colorText, base.text) ?? base.text,
    muted:
      safeColor(tokens.colorTextSecondary ?? tokens.colorNeutral, base.muted) ?? base.muted,
    grid: safeColor(tokens.colorStroke, base.grid) ?? base.grid,
    border: safeColor(tokens.colorStroke, base.border) ?? base.border,
    tooltipBg: safeColor(tokens.colorSurface, base.tooltipBg) ?? base.tooltipBg,
    tooltipText:
      safeColor(tokens.colorTextInverse, base.tooltipText) ?? base.tooltipText,
    palette: safePalette(tokens.category10 ?? tokens.category20, base.palette),
    positive: safeColor(tokens.colorPositive, base.positive) ?? base.positive,
    negative: safeColor(tokens.colorNegative, base.negative) ?? base.negative,
    total: safeColor(tokens.colorDefault, base.total) ?? base.total,
    fontFamily: fontFamily(tokens.fontFamily, base.fontFamily),
    fontSize: positiveNumber(tokens.fontSize, base.fontSize),
    lineHeight: positiveNumber(tokens.lineHeight, base.lineHeight),
    radius: positiveNumber(tokens.radius, base.radius),
    spacing: positiveNumber(tokens.spacingMedium ?? tokens.spacingSmall, base.spacing),
    lineWidth: positiveNumber(tokens.lineWidth, base.lineWidth),
  };

  return {
    ...next,
    background: safeColor(style.backgroundColor, next.background) ?? next.background,
    palette: safePalette(style.palette, next.palette),
    lineWidth: positiveNumber(style.lineWidth, next.lineWidth),
  };
}

export function resolveChartTheme(
  theme: unknown,
  type: string,
  localStyle?: ThemeStyle,
  fallback: VisualizationTheme = 'default',
): ResolvedTheme {
  const resolved = resolveTheme(theme, fallback);
  const spec = isThemeSpec(theme) ? theme : undefined;
  const chartStyle = spec?.charts?.[type]?.style;
  const merged = mergeObjects(
    resolved as unknown as Record<string, unknown>,
    chartStyle as Record<string, unknown> | undefined,
  );
  const final = mergeObjects(merged, localStyle as Record<string, unknown> | undefined) as unknown as ResolvedTheme;
  return {
    ...final,
    background: safeColor(final.background, resolved.background) ?? resolved.background,
    palette: safePalette(final.palette, resolved.palette),
  };
}
