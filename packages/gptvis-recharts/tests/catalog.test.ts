import { describe, expect, it } from 'vitest';
import { CHARTS, SUPPORTED, chartLabel } from '../src/catalog.js';

describe('chart catalog', () => {
  it('contains exactly the 26 GPT-Vis chart types', () => {
    expect(CHARTS).toHaveLength(26);
    expect(SUPPORTED.size).toBe(26);
    expect(new Set(CHARTS.map((item) => item.type)).size).toBe(26);
  });

  it('returns labels and falls back to the type identifier', () => {
    expect(chartLabel('line')).toBe('折线图');
    expect(chartLabel('unknown')).toBe('unknown');
  });
});
