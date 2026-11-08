import { describe, expect, it } from 'vitest';
import {
  isThemeName,
  resolveChartTheme,
  resolveTheme,
  safeColor,
  safePalette,
  THEME_NAMES,
} from '../src/theme/index.js';

describe('themes', () => {
  it('supports every core and gallery theme', () => {
    for (const name of THEME_NAMES) {
      const theme = resolveTheme(name);
      expect(theme.name).toBe(name);
      expect(theme.palette.length).toBeGreaterThan(0);
      expect(isThemeName(name)).toBe(true);
    }
    expect(THEME_NAMES).toHaveLength(14);
  });

  it('applies tokens, base themes, and style overrides', () => {
    const theme = resolveTheme({
      id: 'brand',
      label: 'Brand',
      baseTheme: 'dark',
      tokens: {
        colorBackground: '#ffffff',
        colorText: '#111111',
        colorDefault: '#7047eb',
        category10: ['#111111', '#222222'],
        fontFamily: 'Arial, sans-serif',
        radius: 8,
      },
      style: { backgroundColor: '#fefefe', palette: ['#123456'] },
    });
    expect(theme.background).toBe('#fefefe');
    expect(theme.text).toBe('#111111');
    expect(theme.total).toBe('#7047eb');
    expect(theme.palette).toEqual(['#123456']);
    expect(theme.fontFamily).toBe('Arial, sans-serif');
    expect(theme.radius).toBe(8);
  });

  it('applies per-chart and local style precedence', () => {
    const theme = resolveChartTheme(
      {
        id: 'brand',
        label: 'Brand',
        charts: { line: { style: { palette: ['#abcdef'] } } },
      },
      'line',
      { palette: ['#fedcba'] },
    );
    expect(theme.palette).toEqual(['#fedcba']);

    const chartOnly = resolveChartTheme(
      {
        id: 'brand',
        label: 'Brand',
        charts: { line: { style: { palette: ['#abcdef'] } } },
      },
      'line',
    );
    expect(chartOnly.palette).toEqual(['#abcdef']);
  });

  it('rejects hostile color values and empty palettes', () => {
    expect(safeColor('url(javascript:alert(1))')).toBeUndefined();
    expect(safeColor('var(--brand)')).toBeUndefined();
    expect(safePalette(['red', 'url(x)', '#123'], ['#000000'])).toEqual(['red', '#123']);
    expect(safePalette(['url(x)'], ['#000000'])).toEqual(['#000000']);
  });

  it('does not allow theme specs to mutate object prototypes', () => {
    const spec = JSON.parse(
      '{"id":"prototype","label":"Prototype","style":{"__proto__":{"polluted":true}}}',
    ) as Parameters<typeof resolveTheme>[0];
    resolveTheme(spec);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
