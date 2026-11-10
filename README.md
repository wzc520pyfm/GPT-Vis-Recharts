# GPT-Vis-Recharts

[![npm version](https://img.shields.io/npm/v/gptvis-recharts.svg)](https://www.npmjs.com/package/gptvis-recharts)
[![npm](https://img.shields.io/npm/v/gptvis-recharts/latest.svg?label=latest)](https://www.npmjs.com/package/gptvis-recharts)
[![npm downloads](https://img.shields.io/npm/dm/gptvis-recharts.svg)](https://www.npmjs.com/package/gptvis-recharts)

让 Recharts 用户直接使用 [GPT-Vis](https://github.com/antvis/GPT-Vis) 的 `vis` 语法、JSON 配置、主题、流式渲染和 26 种图表类型。

GPT-Vis 为 AntV 图表生态提供了面向 LLM 的可视化语法。GPT-Vis-Recharts 将这个接口带到 Recharts：Recharts 渲染它擅长的统计图、矩形树图和桑基图，其余图表由共享主题体系下的可访问 SVG/HTML 渲染器完成。

## 特性

- 完整支持 GPT-Vis 1.3 的 26 种图表类型。
- 同一套 `vis` 语法、JSON 对象、流式输入和构造函数。
- 支持 `GPTVis` 命令式 API 与 `GPTVisChart` React 组件。
- 14 个内置主题与可复用 `ThemeSpec`。
- `gptvis-recharts/syntax` 可在 Node 中解析，不加载 React、React DOM 或 Recharts。
- 图表与文本只通过 React 文本节点渲染，不使用 `dangerouslySetInnerHTML`。
- 可选 wrapper：图表/源码标签页、复制、SVG 下载与关系图缩放。

## 安装

```bash
npm install gptvis-recharts recharts react react-dom
```

当前测试基线为 Recharts `3.10.1`、React 18/19、Node 20+。Recharts、React 与 React DOM 是 peer dependencies。

## 快速开始

```ts
import { GPTVis } from 'gptvis-recharts';

const vis = new GPTVis({
  container: '#chart',
  height: 420,
  theme: 'default',
});

vis.render(`
vis line
title 月度销售
axisXTitle 月份
axisYTitle 万元
data
  - time 1月
    value 120
  - time 2月
    value 148
  - time 3月
    value 171
`);
```

React：

```tsx
import { GPTVisChart } from 'gptvis-recharts/react';

<GPTVisChart content={buffer} theme="midnight" streaming />;
```

## 26 种图表

`line`、`area`、`column`、`bar`、`pie`、`scatter`、`radar`、`funnel`、`waterfall`、`dual-axes`、`histogram`、`boxplot`、`violin`、`venn`、`sankey`、`treemap`、`word-cloud`、`liquid`、`flow-diagram`、`network-graph`、`mindmap`、`indented-tree`、`organization-chart`、`fishbone-diagram`、`table`、`summary`。

完整 API、主题、安全边界与渲染器矩阵见 [包文档](packages/gptvis-recharts/README.md)。

## 开发

```bash
npm install
npm run dev       # http://127.0.0.1:4318
npm test
npm run typecheck
npm run build
```

`npm run dev` 先构建库，再启动 Vite playground。Playground 提供 26 个示例、语法/JSON 模式、主题选择、流式模拟、状态显示和 wrapper 开关。

## 仓库结构

- `packages/gptvis-recharts`：发布包。
- `playground`：Vite + React 演示站。
- `docs/superpowers`：设计规格与实施计划。

## 许可与致谢

本项目使用 MIT 许可。`vis` 语法与图表选择约定来自 [AntV GPT-Vis](https://github.com/antvis/GPT-Vis)；图表由 [Recharts](https://github.com/recharts/recharts) 及本项目内置 SVG/HTML 渲染器呈现。详见 [THIRD_PARTY_NOTICES.md](packages/gptvis-recharts/THIRD_PARTY_NOTICES.md)。
