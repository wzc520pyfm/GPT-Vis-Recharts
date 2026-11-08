---
name: chart-visualization
description: 使用 GPT-Vis-Recharts 的 vis 语法、JSON 配置和 React API 选择并生成图表；支持 26 种 GPT-Vis 图表、流式输出、主题与安全约束。
---

# GPT-Vis-Recharts 图表生成

使用 `gptvis-recharts` 生成与 GPT-Vis 兼容的可视化。图表由 Recharts、共享 SVG 或语义 HTML 渲染；不要输出 ECharts `option`、G2 spec 或任意 Recharts props。

## 工作流程

1. 根据分析意图和数据形态选择一种受支持图表。
2. 将用户数据转换为该类型要求的字段。
3. 默认输出可直接传给 `render()` 的严格 JSON。
4. 用户要求流式或简写时，输出 `vis <type>` 语法。
5. 用户要求代码时，使用 `gptvis-recharts`，并包含容器尺寸与清理。
6. 检查数据字段、单位、比例范围、图节点引用和主题边界。

## 选型

| 意图 | 首选类型 | 避免 |
| --- | --- | --- |
| 时间趋势 | `line`, `area` | 大量类别时避免 `pie` |
| 分类比较 | `column`, `bar` | 长标签优先 `bar` |
| 不同量纲共享分类轴 | `dual-axes` | 不要用双轴掩盖相关性 |
| 构成占比 | `pie`, `treemap` | 类别多时避免 `pie` |
| 阶段转化 | `funnel` | 不相邻阶段不要伪造转化率 |
| 增减贡献 | `waterfall` | 不要漏掉期初/期末合计 |
| 单比例/进度 | `liquid` | 多个比例改用 `column` |
| 两变量关系 | `scatter` | 时间顺序改用 `line` |
| 连续样本频次 | `histogram` | 已聚合的类别改用 `column` |
| 分组分布/离群值 | `boxplot` | 样本极少时标注样本量 |
| 分布密度 | `violin` | 不代替精确分位数表 |
| 多维比较 | `radar` | 指标量纲不同时先归一化 |
| 集合交集 | `venn` | 最多三个集合 |
| 带权流向 | `sankey` | 无权重关系改用 `network-graph` |
| 步骤/依赖 | `flow-diagram` | 有环网络改用 `network-graph` |
| 实体关联 | `network-graph` | 不要编造不存在的边 |
| 知识结构 | `mindmap` | 单一严格层级可用 `indented-tree` |
| 目录/层级名单 | `indented-tree` | 需要面积编码时用 `treemap` |
| 组织层级 | `organization-chart` | 跨组织网络用 `network-graph` |
| 根因分析 | `fishbone-diagram` | 不要编造根因，只组织用户给出的原因 |
| 词频概览 | `word-cloud` | 精确比较用 `bar` |
| 精确查阅 | `table` | 趋势解读用 `summary` |
| 数据叙事 | `summary` | 不用 Markdown 链接承载导航 |

## 输出 JSON

严格 JSON，无注释、函数、尾随逗号或 `undefined`。

```json
{
  "type": "column",
  "title": "区域销售额",
  "axisXTitle": "区域",
  "axisYTitle": "万元",
  "data": [
    { "category": "华东", "value": 120 },
    { "category": "华南", "value": 98 }
  ]
}
```

通用字段：`type`、`title?`、`subtitle?`、`theme?`、`style?`。

## 输出 Syntax

```text
vis column
title 区域销售额
axisXTitle 区域
axisYTitle 万元
data
  - category 华东
    value 120
  - category 华南
    value 98
```

- 首行必须是 `vis <type>`。
- 字段写作 `key value`，每行一个。
- 嵌套对象用缩进。
- 数组项以 `-` 开始，后续字段与首字段对齐。
- 含空格的字符串加引号。
- 数字与布尔值保持原生类型。
- Summary 不写 `vis summary`，直接输出叙事文本。

## 数据契约

| 类型 | 数据 |
| --- | --- |
| `line`, `area` | `{ time, value, group? }[]`；area 支持 `stack` |
| `column`, `bar` | `{ category, value, group? }[]`；支持 `stack`, `label` |
| `pie` | `{ category, value }[]`；`innerRadius` 0–1 |
| `scatter` | `{ x, y, group? }[]` |
| `radar` | `{ name, value, group? }[]`；支持 `align` |
| `funnel` | `{ category, value }[]`；阶段顺序即数据顺序 |
| `waterfall` | `{ category, value?, isTotal?, isIntermediateTotal? }[]` |
| `dual-axes` | `categories: string[]`、`series: { type, data, axisYTitle? }[]` |
| `histogram` | `number[]`、`binNumber?` |
| `boxplot`, `violin` | 原始样本 `{ category, value, group? }[]` |
| `venn` | `{ sets: string \| string[], value, label? }[]` |
| `sankey` | `{ source, target, value }[]`、`nodeAlign?` |
| `treemap` | 一个或多个嵌套 `{ name, value, children? }` |
| `word-cloud` | `{ text, value }[]` |
| `liquid` | `percent` 0–1、`shape?`: `circle \| rect \| pin \| triangle` |
| `flow-diagram`, `network-graph` | `data: { nodes: {name}[], edges: {source,target,name?}[] }` |
| `network-graph` | 另支持 `layout`: `force \| circular \| grid \| radial \| concentric \| dagre` |
| `mindmap`, `indented-tree`, `organization-chart`, `fishbone-diagram` | 单个树 root `{ name, description?, children? }` |
| `table` | `Record<string, unknown>[]` |
| `summary` | 普通叙事字符串或 `{ "type": "summary", "content": "..." }` |

多系列记录都要提供 `group`。不要同时设置 `stack: true` 和 `group: true`；两者冲突时优先明确用户意图。

## Summary 安全子集

支持：

- ATX 标题 `#`–`######`。
- 段落、无序/有序列表、围栏代码块。
- `**粗体**`、`` `行内代码` ``。
- 语义实体 `[显示文本](entity_type, key=value)`。

实体类型：

`metric_name`、`metric_value`、`other_metric_value`、`delta_value`、`ratio_value`、`contribute_ratio`、`proportion`、`trend_desc`、`dim_value`、`time_desc`、`rank`、`difference`、`anomaly`、`association`、`distribution`、`seasonality`。

属性：

- `origin`：原始数值。
- `assessment`：`positive`、`negative`、`equal`。
- `unit`：单位文本。
- `detail`：数字数组、`{x,y}` 点数组，或季节性的 `{"data":[...],"range":[min,max]}`。

示例：

```text
# Q4 报告

收入达到 [¥520万](metric_value, origin=5200000, detail=[310,360,410,520])，
同比增长 [18%](ratio_value, origin=0.18, assessment="positive")。
[北美地区](dim_value)贡献 [40%](contribute_ratio, origin=0.40)。
```

不要生成可导航链接。无效实体目标和普通 Markdown 链接会按文本呈现。

## 主题

内置：

`default`、`light`、`dark`、`academy`、`gpt-vis`、`midnight`、`paper`、`product`、`neon-circuit`、`terra-print`、`mono-signal`、`candy-pop`、`pop`、`bauhaus`。

没有风格要求用 `default`。深色界面用 `dark` 或 `midnight`。ThemeSpec：

```json
{
  "id": "brand",
  "label": "品牌主题",
  "baseTheme": "light",
  "tokens": {
    "colorDefault": "#2563eb",
    "colorText": "#111827",
    "category10": ["#2563eb", "#0f8b78", "#d97706"],
    "radius": 8
  },
  "style": {
    "backgroundColor": "#f8fafc",
    "palette": ["#2563eb", "#0f8b78", "#d97706"]
  }
}
```

颜色必须是合法 CSS 颜色。不要把布局选项放进主题。

## 代码

```bash
npm install gptvis-recharts recharts react react-dom
```

命令式：

```ts
import { GPTVis } from 'gptvis-recharts';

const vis = new GPTVis({ container: '#chart', height: 400, theme: 'default' });
vis.render(config);
vis.destroy();
```

React：

```tsx
import { GPTVisChart } from 'gptvis-recharts/react';

<GPTVisChart content={config} theme="default" style={{ height: 400 }} />
```

流式：

```tsx
<GPTVisChart content={buffer} streaming />
```

仅服务端解析：

```ts
import { parse, isVisSyntax, readConfig } from 'gptvis-recharts/syntax';
```

## 安全与限制

- 不输出 HTML 字符串、JavaScript、React 组件、事件处理器或任意 Recharts props。
- 数值必须是有限数字，不要使用 `"35%"`、`"1,200"` 作为数值字段。
- 图边只能引用已声明节点。
- `summary` 不使用可导航链接或原始 HTML。
- 上限：10,000 数据行、250 图/树节点、1,000 边、50 词云词条、树深 20、20 个 series/group、标题 500 字符、label 2,000 字符。

## 交付检查

- 选择的类型与数据结构匹配。
- 必填字段完整，类别顺序有意义，数值单位一致。
- `pie` 类别通常不超过 5 个，`venn` 不超过 3 个集合。
- 双轴序列长度与 categories 一致。
- 图节点引用有效，树只有一个 root。
- 比例字段在 0–1。
- 没有编造数据、根因、关系或转化率。
- JSON 可解析，Syntax 可从 `vis` 正常渲染。
