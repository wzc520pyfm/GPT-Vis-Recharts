import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build/index.js';
import { SummaryView } from '../src/render/html/SummaryView.js';
import {
  parseSummary,
  parseSummaryInline,
  type SummaryEntity,
} from '../src/render/html/summary-parser.js';

function entities(text: string): SummaryEntity[] {
  return parseSummaryInline(text).filter(
    (node): node is SummaryEntity => node.kind === 'entity',
  );
}

describe('summary parser', () => {
  it('parses headings, paragraphs, lists, emphasis, and code', () => {
    const blocks = parseSummary(
      '# Title\n\nA **bold** paragraph with `code`.\n\n- one\n- two\n\n1. first\n2. second\n\n```\nconst x = 1;\n```',
    );
    expect(blocks.map((block) => block.kind)).toEqual([
      'heading',
      'paragraph',
      'list',
      'list',
      'code',
    ]);
  });

  it('parses entity attributes and numeric detail without trusting supplied statistics', () => {
    const [metric] = entities(
      '[Revenue](metric_value, origin=123000, unit="USD", assessment="positive", detail=[1, 2, 3])',
    );
    expect(metric).toMatchObject({
      entityType: 'metric_value',
      origin: 123000,
      unit: 'USD',
      assessment: 'positive',
      detail: [1, 2, 3],
    });

    const [association] = entities(
      '[Strong](association, detail=[{"x":1,"y":2},{"x":2,"y":4}])',
    );
    expect(association?.detail).toEqual([
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ]);

    const [seasonality] = entities(
      '[Seasonal](seasonality, detail={"data":[80,90,95,135],"range":[0,150]})',
    );
    expect(seasonality?.detail).toEqual({ data: [80, 90, 95, 135], range: [0, 150] });
  });

  it('keeps links non-navigable and invalid entity targets as text', () => {
    const nodes = parseSummaryInline('[Report](https://evil.example) [Data](unknown_entity)');
    expect(nodes.every((node) => node.kind === 'text')).toBe(true);
    expect(nodes.map((node) => (node.kind === 'text' ? node.text : '')).join('')).toContain(
      'https://evil.example',
    );
  });

  it('treats prototype-like attributes as inert data', () => {
    entities('[Metric](metric_value, __proto__=polluted, constructor=changed)');
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});

describe('summary rendering', () => {
  it('renders semantic chips and sparklines without links or HTML injection', () => {
    const view = buildView({
      type: 'summary',
      title: 'Report',
      content:
        '# Results\n\nRevenue reached [¥10万](metric_value, origin=100000, detail=[1,2,3]).\n\n<img src=x onerror=alert(1)> [Report](https://evil.example)',
    });
    expect(view.kind).toBe('ready');
    if (view.kind !== 'ready' || view.model.type !== 'summary') return;
    const { container, unmount } = render(<SummaryView model={view.model} />);
    expect(container.querySelector('[data-entity-type="metric_value"]')).toBeTruthy();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    unmount();
  });
});
