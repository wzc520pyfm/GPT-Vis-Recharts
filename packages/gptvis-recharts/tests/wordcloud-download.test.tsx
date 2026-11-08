import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildView } from '../src/build/index.js';
import { WordCloudView } from '../src/render/svg/WordCloudView.js';
import { serializeSvg } from '../src/wrapper/download.js';

describe('word cloud and SVG export', () => {
  it('lays out words deterministically and exposes an accessible frequency list', () => {
    const view = buildView({
      type: 'word-cloud',
      data: ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'].map((text, index) => ({
        text,
        value: 20 - index,
      })),
    });
    expect(view.kind).toBe('ready');
    if (view.kind !== 'ready' || view.model.type !== 'word-cloud') return;

    const first = render(<WordCloudView model={view.model} />);
    const firstMarkup = first.container.innerHTML;
    first.unmount();
    const second = render(<WordCloudView model={view.model} />);
    expect(second.container.innerHTML).toBe(firstMarkup);
    expect(second.container.querySelectorAll('ul li')).toHaveLength(6);
    expect(second.container.querySelectorAll('svg text')).toHaveLength(6);
    second.unmount();
  });

  it('serializes safe SVG with a background and explicit dimensions', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 100');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = '</svg><script>alert(1)</script>';
    svg.appendChild(text);

    const source = serializeSvg(svg, '#ffffff');
    expect(source).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(source).toContain('width="200"');
    expect(source).toContain('height="100"');
    expect(source).toContain('fill="#ffffff"');
    expect(source).not.toContain('<script>');
    expect(source).toContain('&lt;script&gt;');
  });
});
