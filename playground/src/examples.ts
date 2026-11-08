import { CHARTS, chartLabel, parse, type ChartType } from 'gptvis-recharts';

export interface PlaygroundExample {
  type: ChartType;
  label: string;
  group: '统计' | '关系' | '文本';
  note: string;
  syntax: string;
  object: Record<string, unknown>;
}

const stats = CHARTS.filter((chart) => chart.group === '统计');
const relationship = CHARTS.filter((chart) => chart.group === '关系');
const text = CHARTS.filter((chart) => chart.group === '文本');

function example(type: ChartType, syntax: string): PlaygroundExample {
  const chart = CHARTS.find((item) => item.type === type);
  return {
    type,
    label: chartLabel(type),
    group: chart?.group ?? '统计',
    note: chart?.note ?? '',
    syntax,
    object: parse(syntax),
  };
}

const SUMMARY_TEXT = `# Q4 销售报告

## 概述

在 [2024年Q4](time_desc)，[总收入](metric_name)达到
[¥520万](metric_value, origin=5200000, detail=[310,360,410,520])，
相比 Q3 增长 [¥80万](delta_value, origin=800000, assessment="positive")，
增长率为 [18%](ratio_value, origin=0.18, assessment="positive")。

## 地区表现

[北美地区](dim_value)占总收入的
[40%](contribute_ratio, origin=0.40, assessment="positive")，
在所有市场中 [排名第一](rank, detail=[210,180,130,95])。
`

const summaryChart = text.find((chart) => chart.type === 'summary');

const EXAMPLES: PlaygroundExample[] = [
  example(
    'line',
    `
vis line
title 月度销售趋势
subtitle 华东与华南区域
axisXTitle 月份
axisYTitle 销售额（万元）
data
  - time 1月
    value 120
    group 华东
  - time 1月
    value 92
    group 华南
  - time 2月
    value 136
    group 华东
  - time 2月
    value 104
    group 华南
  - time 3月
    value 158
    group 华东
  - time 3月
    value 128
    group 华南
  - time 4月
    value 171
    group 华东
  - time 4月
    value 149
    group 华南
`,
  ),
  example(
    'area',
    `
vis area
title 渠道流量构成
stack true
data
  - time 周一
    value 42
    group 自然搜索
  - time 周一
    value 24
    group 付费投放
  - time 周二
    value 48
    group 自然搜索
  - time 周二
    value 31
    group 付费投放
  - time 周三
    value 55
    group 自然搜索
  - time 周三
    value 29
    group 付费投放
`,
  ),
  example(
    'column',
    `
vis column
title 各产品收入
label true
data
  - category 数据分析
    value 72
  - category 智能问数
    value 58
  - category 报表平台
    value 46
  - category 移动分析
    value 34
`,
  ),
  example(
    'bar',
    `
vis bar
title 用户满意度排名
data
  - category 响应速度
    value 92
  - category 易用性
    value 88
  - category 稳定性
    value 84
  - category 功能完整度
    value 79
`,
  ),
  example(
    'pie',
    `
vis pie
title 收入构成
innerRadius 0.48
data
  - category 订阅
    value 48
  - category 增值服务
    value 27
  - category 实施交付
    value 17
  - category 其他
    value 8
`,
  ),
  example(
    'scatter',
    `
vis scatter
title 投入与转化关系
axisXTitle 投放预算
axisYTitle 转化用户
data
  - x 12
    y 38
    group A
  - x 18
    y 54
    group A
  - x 24
    y 61
    group A
  - x 14
    y 29
    group B
  - x 20
    y 46
    group B
  - x 28
    y 72
    group B
`,
  ),
  example(
    'radar',
    `
vis radar
title 产品能力评估
data
  - name 性能
    value 86
  - name 易用性
    value 78
  - name 扩展性
    value 91
  - name 稳定性
    value 88
  - name 可观测性
    value 73
`,
  ),
  example(
    'funnel',
    `
vis funnel
title 新用户转化漏斗
conversionRateLabel 总转化率 4.8%
data
  - category 访问
    value 10000
  - category 注册
    value 3200
  - category 激活
    value 1800
  - category 付费
    value 480
`,
  ),
  example(
    'waterfall',
    `
vis waterfall
title 季度利润变化
data
  - category 期初利润
    value 520
    isTotal true
  - category 新增收入
    value 180
  - category 人力成本
    value -64
  - category 云资源
    value -38
  - category 营销投入
    value -42
  - category 期末利润
    value 556
    isTotal true
`,
  ),
  example(
    'dual-axes',
    `
vis dual-axes
title 收入与增长率
categories
  - Q1
  - Q2
  - Q3
  - Q4
series
  - type column
    axisYTitle 收入（万元）
    data
      - 320
      - 410
      - 520
      - 640
  - type line
    axisYTitle 增长率
    data
      - 0.12
      - 0.18
      - 0.21
      - 0.19
`,
  ),
  example(
    'histogram',
    `
vis histogram
title 请求延迟分布
axisXTitle 延迟（ms）
axisYTitle 请求数
binNumber 8
data
  - 12
  - 18
  - 22
  - 25
  - 29
  - 31
  - 36
  - 38
  - 42
  - 47
  - 53
  - 61
  - 72
  - 88
  - 104
`,
  ),
  example(
    'boxplot',
    `
vis boxplot
title 各渠道客单价
data
  - category 搜索
    value 82
  - category 搜索
    value 95
  - category 搜索
    value 102
  - category 搜索
    value 119
  - category 搜索
    value 188
  - category 社交
    value 61
  - category 社交
    value 74
  - category 社交
    value 80
  - category 社交
    value 96
  - category 社交
    value 128
`,
  ),
  example(
    'violin',
    `
vis violin
title 用户活跃时长分布
data
  - category 新用户
    value 8
  - category 新用户
    value 12
  - category 新用户
    value 15
  - category 新用户
    value 19
  - category 新用户
    value 38
  - category 老用户
    value 25
  - category 老用户
    value 31
  - category 老用户
    value 36
  - category 老用户
    value 44
  - category 老用户
    value 70
`,
  ),
  example(
    'venn',
    `
vis venn
title 用户兴趣重叠
data
  - sets 数据分析
    value 48
  - sets 人工智能
    value 42
  - sets 数据可视化
    value 31
  - sets 数据分析 人工智能
    value 16
  - sets 数据分析 数据可视化
    value 12
  - sets 人工智能 数据可视化
    value 9
`,
  ),
  example(
    'sankey',
    `
vis sankey
title 流量来源与转化
nodeAlign justify
data
  - source 自然搜索
    target 产品页
    value 46
  - source 付费广告
    target 产品页
    value 32
  - source 内容社区
    target 产品页
    value 18
  - source 产品页
    target 注册
    value 54
  - source 产品页
    target 流失
    value 42
  - source 注册
    target 付费
    value 21
`,
  ),
  example(
    'treemap',
    `
vis treemap
title 业务收入结构
data
  - name 全部业务
    children
      - name 数据产品
        value 180
      - name 解决方案
        value 120
      - name 专业服务
        value 72
      - name 生态合作
        value 48
`,
  ),
  example(
    'word-cloud',
    `
vis word-cloud
title 用户反馈关键词
data
  - text 易用
    value 42
  - text 稳定
    value 36
  - text 响应快
    value 31
  - text 可视化
    value 28
  - text 智能分析
    value 25
  - text 报表
    value 21
  - text 协作
    value 17
  - text 移动端
    value 14
  - text 性能
    value 12
  - text 集成
    value 9
`,
  ),
  example(
    'liquid',
    `
vis liquid
title 季度目标完成度
percent 0.72
shape circle
`,
  ),
  example(
    'flow-diagram',
    `
vis flow-diagram
title 数据发布流程
data
  nodes
    - name 数据接入
    - name 质量校验
    - name 指标计算
    - name 发布
  edges
    - source 数据接入
      target 质量校验
    - source 质量校验
      target 指标计算
      name 通过
    - source 指标计算
      target 发布
`,
  ),
  example(
    'network-graph',
    `
vis network-graph
title 服务依赖网络
layout circular
data
  nodes
    - name Gateway
    - name Auth
    - name Query
    - name Metadata
    - name Storage
  edges
    - source Gateway
      target Auth
    - source Gateway
      target Query
    - source Query
      target Metadata
    - source Query
      target Storage
    - source Metadata
      target Storage
`,
  ),
  example(
    'mindmap',
    `
vis mindmap
title 产品发布计划
data
  - name 产品发布
    children
      - name 设计
        children
          - name 用户研究
          - name 交互稿
      - name 研发
        children
          - name 前端
          - name 后端
      - name 上线
        children
          - name 灰度
          - name 全量
`,
  ),
  example(
    'indented-tree',
    `
vis indented-tree
title 指标树
direction LR
data
  name 经营指标
  children
    - name 收入
      children
        - name 新签
        - name 续费
    - name 成本
      children
        - name 人力
        - name 云资源
`,
  ),
  example(
    'organization-chart',
    `
vis organization-chart
title 组织架构
data
  name 总部
  description 全球业务
  children
    - name 产品中心
      description 产品与设计
    - name 研发中心
      description 工程与平台
    - name 商业中心
      description 销售与客户成功
`,
  ),
  example(
    'fishbone-diagram',
    `
vis fishbone-diagram
title 交付延期原因
data
  name 交付延期
  children
    - name 人员
      children
        - name 排期不足
    - name 流程
      children
        - name 评审等待
    - name 技术
      children
        - name 环境阻塞
    - name 需求
      children
        - name 范围变更
`,
  ),
  example(
    'table',
    `
vis table
title 餐饮业态营收占比
data
  - 类别 火锅
    营收额占比 22
  - 类别 自助餐
    营收额占比 12
  - 类别 小吃快餐
    营收额占比 8
  - 类别 西餐
    营收额占比 6
  - 类别 其它
    营收额占比 44
`,
  ),
  {
    type: 'summary',
    label: summaryChart?.label ?? '摘要',
    group: '文本',
    note: summaryChart?.note ?? '叙述文本',
    syntax: SUMMARY_TEXT,
    object: { type: 'summary', content: SUMMARY_TEXT },
  },
];

export const GROUPS: Array<'统计' | '关系' | '文本'> = ['统计', '关系', '文本'];
export { EXAMPLES, stats, relationship, text };
