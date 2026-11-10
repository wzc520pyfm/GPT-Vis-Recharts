# gptvis-recharts

[![npm version](https://img.shields.io/npm/v/gptvis-recharts.svg)](https://www.npmjs.com/package/gptvis-recharts)
[![npm](https://img.shields.io/npm/v/gptvis-recharts/latest.svg?label=latest)](https://www.npmjs.com/package/gptvis-recharts)
[![npm downloads](https://img.shields.io/npm/dm/gptvis-recharts.svg)](https://www.npmjs.com/package/gptvis-recharts)

Recharts 版的 [GPT-Vis](https://github.com/antvis/GPT-Vis) 适配层。使用同一套 `vis` 语法、JSON 配置、主题、流式输出和 26 种图表类型。

## 安装

```bash
npm install gptvis-recharts recharts react react-dom
```

```json
{
  "peerDependencies": {
    "recharts": "^3.10.0",
    "react": ">=18",
    "react-dom": ">=18"
  }
}
```

包为 ESM，要求 Node 20+。React 18 和 19 均可使用。

## 命令式 API

```ts
import { GPTVis } from 'gptvis-recharts';

const vis = new GPTVis({
  container: '#chart',
  width: 640,
  height: 400,
  theme: 'default',
  wrapper: false,
  locale: 'zh-CN',
  onStatus: (status) => {
    // pending | ready | unsupported | error
    console.log(status);
  },
});

vis.render({
  type: 'column',
  title: '区域销售额',
  data: [
    { category: '华东', value: 120 },
    { category: '华南', value: 98 },
  ],
});

vis.resize();
vis.zoomTo(1.2);
vis.getZoom();
vis.destroy();
```

`render()` 接受：

- 含 `type` 的配置对象。
- JSON 字符串。
- 以 `vis <type>` 开头的语法字符串。
- 完整或不完整的 fenced `vis` 代码块。
- 不以 `vis` 开头的普通文本（作为 `summary`）。

尺寸未显式提供时，runtime 使用 `ResizeObserver` 跟随容器。`container` 接受 CSS 选择器或 `HTMLElement`。

### 绑定式 API

```ts
import { bindGPTVis } from 'gptvis-recharts';

const chart = bindGPTVis('#chart', { theme: 'dark', height: 360 });
chart.update('vis pie\ndata\n  - category A\n    value 30\n  - category B\n    value 70');
chart.resize();
chart.destroy();
```

## React API

```tsx
import { GPTVisChart } from 'gptvis-recharts/react';

export function StreamingChart({ buffer }: { buffer: string }) {
  return (
    <GPTVisChart
      content={buffer}
      theme="midnight"
      streaming
      wrapper
      locale="zh-CN"
      className="chart"
      style={{ height: 420 }}
      onStatus={(status) => console.log(status)}
    />
  );
}
```

`GPTVisChart` 直接渲染 React 树，不嵌套第二个 React root。`VisChart` 是同一实现的低层导出。

主入口也导出 `GPTVisChart`、`VisChart` 及 `GPTVisChartProps` 类型，但只做解析时优先使用 `./syntax`。

## 流式输出

```ts
const vis = new GPTVis({
  container: '#chart',
  height: 400,
  streaming: true,
});

let buffer = '';
for await (const token of stream) {
  buffer += token;
  vis.render(buffer);
}
```

```tsx
<GPTVisChart content={buffer} streaming />
```

流式模式下：

- 未完成的最后一行会被丢弃。
- 只有前缀如 `vis`、`vis lin` 时显示可访问的 pending 状态。
- 已完成的数据行继续更新图表。
- 动画关闭，减少 token 更新造成的闪烁和布局抖动。

## 语法

```text
vis area
title 渠道流量
stack true
data
  - time 周一
    value 42
    group 自然搜索
  - time 周一
    value 24
    group 付费投放
style
  palette
    - #3659c9
    - #087f73
```

支持：

- `key value`、`key: value`、`key=value`。
- `data`、`categories`、`series`、`children`、`nodes`、`edges` 数组段。
- `style` 嵌套对象。
- 引号字符串、有限数字和布尔值。
- 树形 `children`、图 `nodes/edges`、双轴嵌套 `series.data`。

`data` 行缺少必需字段时会被忽略。空数据返回可访问的 empty state，未知类型返回 `unsupported`，解析或约束失败返回 `error`。

## 构造函数

每个构造函数都接收与 `GPTVis` 相同的选项，`container` 必填。对象输入无需再写 `type`，构造函数会合并自己的类型。

```ts
import { Line, Pie, Summary } from 'gptvis-recharts';

const line = Line({ container: '#line', height: 360 });
line.render({
  title: '趋势',
  data: [
    { time: 'Q1', value: 10 },
    { time: 'Q2', value: 16 },
  ],
});

const pie = Pie({ container: '#pie', height: 360 });
pie.render('vis pie\ndata\n  - category A\n    value 30\n  - category B\n    value 70');

const summary = Summary({ container: '#summary' });
summary.render('收入达到 [¥10万](metric_value, origin=100000)。');

line.destroy();
pie.destroy();
summary.destroy();
```

导出：`Line`、`Area`、`Column`、`Bar`、`Pie`、`Scatter`、`Radar`、`Funnel`、`Waterfall`、`DualAxes`、`Histogram`、`Boxplot`、`Violin`、`Venn`、`Sankey`、`Treemap`、`WordCloud`、`Liquid`、`FlowDiagram`、`NetworkGraph`、`Mindmap`、`IndentedTree`、`OrganizationChart`、`FishboneDiagram`、`Table`、`Summary`。

每个实例提供 `render`、`resize`、`destroy`、`zoomTo`、`getZoom`。

## 图表与渲染器

| 类型 | 渲染方式 | 主要字段 |
| --- | --- | --- |
| `line` / `area` | Recharts | `time`, `value`, `group?`, `stack?` |
| `column` / `bar` | Recharts | `category`, `value`, `group?`, `stack?`, `label?` |
| `pie` | Recharts | `category`, `value`, `innerRadius?` |
| `scatter` | Recharts | `x`, `y`, `group?` |
| `radar` | Recharts | `name`, `value`, `group?`, `align?` |
| `funnel` | Recharts | `category`, `value`, `conversionRateLabel?` |
| `waterfall` | Recharts | `category`, `value?`, `isTotal?`, `isIntermediateTotal?` |
| `dual-axes` | Recharts | `categories`, `series[{ type, data, axisYTitle? }]` |
| `histogram` | Recharts | `data: number[]`, `binNumber?` |
| `treemap` | Recharts | `name`, `value`, `children?` |
| `sankey` | Recharts | `source`, `target`, `value`, `nodeAlign?` |
| `boxplot` / `violin` | SVG | `category`, `value`, `group?` |
| `venn` | SVG | `sets`, `value`, `label?` |
| `liquid` | SVG | `percent`（0–1）, `shape?` |
| `word-cloud` | SVG | `text`, `value` |
| `flow-diagram` | SVG | `data.nodes`, `data.edges` |
| `network-graph` | SVG | `data.nodes`, `data.edges`, `layout?` |
| `mindmap` | SVG | 单个 `data` root，`children?`, `direction?` |
| `organization-chart` | SVG | 单个 `data` root，`description?`, `children?` |
| `fishbone-diagram` | SVG | 单个 `data` root，`children?` |
| `indented-tree` | HTML | 单个 `data` root，`direction?` |
| `table` | HTML | `data: Record<string, unknown>[]` |
| `summary` | HTML | `content` / 普通文本 |

Recharts 负责其能准确表达的 13 种图表；其余类型使用共享主题、排版和可访问语义的 SVG/HTML 渲染器。所有布局对相同输入保持确定性。

## 主题

内置名称：

`default`、`light`、`dark`、`academy`、`gpt-vis`、`midnight`、`paper`、`product`、`neon-circuit`、`terra-print`、`mono-signal`、`candy-pop`、`pop`、`bauhaus`。

自定义主题：

```ts
const theme = {
  id: 'brand-report',
  label: '品牌报告',
  baseTheme: 'light',
  tokens: {
    colorDefault: '#2563eb',
    colorText: '#111827',
    category10: ['#2563eb', '#0f8b78', '#d97706'],
    fontFamily: 'Inter, sans-serif',
    radius: 10,
  },
  style: {
    backgroundColor: '#f8fafc',
    palette: ['#2563eb', '#0f8b78', '#d97706'],
  },
  charts: {
    line: { style: { lineWidth: 3 } },
  },
};

<GPTVisChart content={config} theme={theme} />;
```

优先级：内置默认值 < tokens < 全局 `style` < `charts[type].style` < 单图 `style`。数组替换，对象合并。颜色必须是合法 CSS 颜色；危险值会回退到主题默认值。

## Wrapper 与本地化

`wrapper: true` 提供：

- Chart / Source 标签页。
- 复制源码。
- 包含 SVG 的图表下载为 SVG。
- 关系图与树图缩放。

HTML-only 图表（`table`、`summary`、`indented-tree`）和状态页不显示下载按钮。`locale` 支持 `en-US` 与 `zh-CN`，默认 `en-US`。

## 仅语法入口

```ts
import { CHARTS, chartLabel, isVisSyntax, parse, readConfig } from 'gptvis-recharts/syntax';

const config = parse('vis line\ndata\n  - time Jan\n    value 12');
const label = chartLabel(config.type);
```

该入口在 Node 中导入时不会加载 React、React DOM、Recharts 或访问 DOM。适合服务端预处理、校验、提示词工具和代码生成。

## 服务端渲染

```tsx
import { renderToString } from 'react-dom/server';
import { GPTVisChart } from 'gptvis-recharts/react';

const html = renderToString(
  <GPTVisChart content={{ type: 'line', data: [{ time: 'Jan', value: 12 }] }} />,
);
```

命令式 `GPTVis` 需要浏览器 DOM；服务端请使用 `GPTVisChart` 或 `gptvis-recharts/syntax`。

## 安全与限制

- 模型输出不能提供组件、HTML、JavaScript、事件处理器、选择器或任意 Recharts props。
- 所有文本通过 React 文本节点渲染；摘要不使用 `dangerouslySetInnerHTML`，链接不可导航。
- 颜色经过 CSS 颜色校验；数值必须有限。
- 图边只能引用已声明节点。
- `__proto__`、`constructor` 等键作为惰性数据保留，不修改对象原型。
- 下载时通过 XMLSerializer 转义 XML 敏感字符。

限制：

| 资源 | 上限 |
| --- | --- |
| 数据行 | 10,000 |
| 图/树节点 | 250 |
| 图边 | 1,000 |
| 词云词条 | 50 |
| 树深度 | 20 |
| series/group | 20 |
| title/subtitle | 500 字符 |
| label | 2,000 字符 |

超限返回可见的本地化错误，不进行部分渲染。

## 公共导出

- `GPTVis`、`bindGPTVis`
- `GPTVisChart`、`VisChart`
- 26 个图表构造函数
- `parse`、`readConfig`、`isVisSyntax`
- `CHARTS`、`SUPPORTED`、`chartLabel`
- `resolveTheme`、`resolveChartTheme`、`THEME_NAMES`、`THEME_PRESETS`
- 全部配置、模型、主题与状态类型

`gptvis-recharts/react` 专注 React 组件；`gptvis-recharts/syntax` 专注无 UI 解析。

## Playground

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:4318 。页面包括 26 种示例、语法/JSON 编辑、14 个主题、流式模拟、状态与 wrapper 开关。

## 兼容性与非目标

- 不追求与原 GPT-Vis / AntV 的像素级一致。
- 不支持新的 `vis` 字段或任意 Recharts 配置透传。
- 不提供 CommonJS 构建。
- 不做服务端栅格化。

`recharts` 是外部 peer dependency，不随本包打包。

## 许可

MIT。语法与兼容目标来自 [AntV GPT-Vis](https://github.com/antvis/GPT-Vis)；图表库为 Recharts。见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
