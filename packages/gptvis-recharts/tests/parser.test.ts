import { describe, expect, it } from 'vitest';
import { isVisSyntax, parse, readConfig } from '../src/parser.js';

describe('parse', () => {
  it('parses a line chart and preserves value types', () => {
    const config = parse(`
vis line
title 月度销售
axisXTitle 月份
axisYTitle 万元
data
  - time 1月
    value 128
    group 华东
  - time 2月
    value 116
    group 华东
`);

    expect(config).toEqual({
      type: 'line',
      title: '月度销售',
      axisXTitle: '月份',
      axisYTitle: '万元',
      data: [
        { time: '1月', value: 128, group: '华东' },
        { time: '2月', value: 116, group: '华东' },
      ],
    });
  });

  it('parses key separators and quoted values', () => {
    expect(
      parse(`
vis column
title: "North America"
subtitle=Revenue
data
  - category: "New York"
    value 12
`),
    ).toMatchObject({
      type: 'column',
      title: 'North America',
      subtitle: 'Revenue',
      data: [{ category: 'New York', value: 12 }],
    });
  });

  it('parses flat numeric arrays, including inline data', () => {
    expect(
      parse(`
vis histogram
data
  - 78
  - 88
  - 60
binNumber 5
`),
    ).toMatchObject({ type: 'histogram', data: [78, 88, 60], binNumber: 5 });

    expect(parse('vis histogram\ndata 78 88 60 100 95')).toMatchObject({
      data: [78, 88, 60, 100, 95],
    });
  });

  it('parses deeply nested style objects', () => {
    expect(
      parse(`
vis line
style
  backgroundColor #ffffff
  palette
    - #111111
    - #222222
  mark
    line
      lineWidth 3
`),
    ).toMatchObject({
      style: {
        backgroundColor: '#ffffff',
        palette: ['#111111', '#222222'],
        mark: { line: { lineWidth: 3 } },
      },
    });
  });

  it('parses dual-axis nested series data', () => {
    expect(
      parse(`
vis dual-axes
categories
  - Q1
  - Q2
series
  - type column
    axisYTitle 营收
    data
      - 10
      - 20
  - type line
    axisYTitle 增长
    data
      - 0.1
      - 0.2
`),
    ).toMatchObject({
      categories: ['Q1', 'Q2'],
      series: [
        { type: 'column', axisYTitle: '营收', data: [10, 20] },
        { type: 'line', axisYTitle: '增长', data: [0.1, 0.2] },
      ],
    });
  });

  it('parses graph named sections', () => {
    expect(
      parse(`
vis flow-diagram
data
  nodes
    - name 开始
    - name 结束
  edges
    - source 开始
      target 结束
      name 完成
`),
    ).toMatchObject({
      data: {
        nodes: [{ name: '开始' }, { name: '结束' }],
        edges: [{ source: '开始', target: '结束', name: '完成' }],
      },
    });
  });

  it('parses tree data in both bullet and object form', () => {
    const bullet = parse(`
vis mindmap
data
  - name 根节点
    children
      - name 分支 A
      - name 分支 B
`);
    expect(bullet.data).toEqual([
      { name: '根节点', children: [{ name: '分支 A' }, { name: '分支 B' }] },
    ]);

    const object = parse(`
vis organization-chart
data
  name 总部
  description 母公司
  children
    - name 研发
`);
    expect(object.data).toEqual({
      name: '总部',
      description: '母公司',
      children: [{ name: '研发' }],
    });
  });

  it('unwraps complete and incomplete fenced blocks', () => {
    expect(parse('```vis\nvis pie\ndata\n  - category A\n    value 1\n```')).toMatchObject({
      type: 'pie',
      data: [{ category: 'A', value: 1 }],
    });
    expect(parse('```vis\nvis pie')).toMatchObject({ type: 'pie' });
  });

  it('drops an unfinished streaming line but keeps completed rows', () => {
    const buffer = 'vis line\ndata\n  - time 1月\n    value 12\n  - time 2月\n    val';
    const config = parse(buffer, { streaming: true });
    expect(config.type).toBe('line');
    expect(config.data).toEqual(
      expect.arrayContaining([{ time: '1月', value: 12 }, { time: '2月' }]),
    );
  });

  it('treats prototype-like keys as inert data', () => {
    const config = parse(`
vis table
__proto__ polluted
constructor changed
data
  - __proto__ value
`);
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(Object.prototype.hasOwnProperty.call(config, '__proto__')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(config, 'constructor')).toBe(true);
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });
});

describe('readConfig', () => {
  it('reads objects, JSON strings, and summary text', () => {
    expect(readConfig({ type: 'pie', data: [] })).toEqual({ type: 'pie', data: [] });
    expect(readConfig('{"type":"pie","data":[]}')).toEqual({ type: 'pie', data: [] });
    expect(readConfig('A plain summary')).toEqual({
      type: 'summary',
      content: 'A plain summary',
    });
  });

  it('detects syntax and incomplete JSON', () => {
    expect(isVisSyntax('vis pie')).toBe(true);
    expect(isVisSyntax('vis')).toBe(true);
    expect(isVisSyntax('summary')).toBe(false);
    expect(readConfig('{"type":', { streaming: true })).toEqual({ type: '' });
  });
});
