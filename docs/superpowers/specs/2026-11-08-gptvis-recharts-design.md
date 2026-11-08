# GPT-Vis Recharts Design

**Status:** Approved for implementation planning

**Date:** 2026-11-08

**Package:** `gptvis-recharts`

## 1. Goal

Build a Recharts renderer for GPT-Vis so existing GPT-Vis prompts, `vis` syntax, JSON configurations, chart constructors, themes, and streaming workflows work without learning a new visualization language.

The adapter supports all 26 GPT-Vis chart types. Recharts handles the statistical, composition, and flow charts it can express well. Types Recharts cannot express equivalently use accessible native SVG or HTML renderers inside the same package.

## 2. Non-Goals

- Pixel-for-pixel reproduction of GPT-Vis.
- Exposing arbitrary Recharts props or `option` objects to model output.
- Adding new chart types or new public grammar fields.
- Server-side rasterization.
- Editable graphs, drag-and-drop authoring, or collaborative state.

## 3. Compatibility Contract

### 3.1 Chart Types

| Family | Types | Renderer |
| --- | --- | --- |
| Trend and comparison | `line`, `area`, `column`, `bar`, `dual-axes` | Recharts |
| Composition and stage | `pie`, `funnel`, `waterfall`, `liquid` | Recharts for the first three; SVG for `liquid` |
| Distribution and relationship | `scatter`, `histogram`, `radar`, `boxplot`, `violin`, `venn` | Recharts for `scatter`, `histogram`, `radar`; SVG for the rest |
| Hierarchy and flow | `treemap`, `sankey`, `flow-diagram`, `network-graph`, `mindmap`, `indented-tree`, `organization-chart`, `fishbone-diagram` | Recharts for `treemap`, `sankey`; SVG or HTML for the rest |
| Text | `word-cloud`, `table`, `summary` | SVG for `word-cloud`; HTML for the rest |

Public type identifiers, data field names, required fields, and chart-selection semantics match GPT-Vis 1.3.

### 3.2 Main Entry

`gptvis-recharts` exports:

- `GPTVis`
- `bindGPTVis`
- `parse`
- `readConfig`
- `isVisSyntax`
- `CHARTS`
- `chartLabel`
- `resolveTheme`
- All 26 constructors: `Line`, `Area`, `Column`, `Bar`, `Pie`, `Scatter`, `Radar`, `Funnel`, `Waterfall`, `DualAxes`, `Histogram`, `Boxplot`, `Violin`, `Venn`, `Sankey`, `Treemap`, `WordCloud`, `Liquid`, `FlowDiagram`, `NetworkGraph`, `Mindmap`, `IndentedTree`, `OrganizationChart`, `FishboneDiagram`, `Table`, `Summary`
- Public configuration, data, theme, status, and handle types

`gptvis-recharts/react` exports `GPTVisChart` and the lower-level React view.

`gptvis-recharts/syntax` exports parser and catalog APIs without loading React, React DOM, Recharts, browser globals, or wrapper code.

### 3.3 Imperative API

```ts
const vis = new GPTVis({
  container: '#chart',
  width: 640,
  height: 400,
  theme: 'default',
  streaming: false,
  wrapper: false,
  locale: 'zh-CN',
  onStatus: (status) => {},
});

vis.render(input);
vis.resize();
vis.zoomTo(1.2);
vis.getZoom();
vis.destroy();
```

`input` may be a `vis` syntax string, a fenced `vis` block, a JSON string containing `type`, a configuration object containing `type`, or plain summary text.

`bindGPTVis(container, options)` returns `{ update, resize, destroy }`.

### 3.4 React API

```tsx
<GPTVisChart
  content={buffer}
  theme="dark"
  streaming
  wrapper={false}
  locale="zh-CN"
  className="chart"
  style={{ minHeight: 360 }}
  onStatus={setStatus}
/>
```

The React component uses the same parser, normalization, theme resolution, and renderer registry as the imperative API.

### 3.5 Constructors

Each constructor accepts the same options as `GPTVis`, with a required `container`. Its `render` method accepts a partial configuration object, a full configuration object, or a syntax string. Object input has the constructor's chart type merged in.

## 4. Architecture

### 4.1 Workspace

The repository is an npm workspace:

- `packages/gptvis-recharts`: publishable library.
- `playground`: Vite React demo, not published.

Library modules:

- `parser.ts` owns the GPT-Vis grammar, fence handling, and value coercion.
- `build/` converts unknown data into validated discriminated chart models.
- `theme/` resolves built-in themes and `ThemeSpec` into renderer tokens.
- `render/` maps validated models to Recharts, SVG, or HTML components.
- `runtime.ts` owns the container, React root, status reporting, streaming state, resizing, zoom, and cleanup.
- `wrapper/` owns optional tabs, copy, download, and zoom controls.
- `charts.ts` owns the constructor facade.

### 4.2 Data Flow

```text
string | object
  -> parser / config reader
  -> chart-type dispatch
  -> type-specific normalizer
  -> validated discriminated model
  -> theme resolver
  -> renderer
  -> React view
```

Renderers never parse source text. One immutable model is built per render.

### 4.3 Runtime

`GPTVis` creates one React root with `createRoot` on a host element it owns inside the target container. It updates the root on every render and unmounts it on `destroy`.

The runtime:

- Keeps the current options and last input.
- Uses `ResizeObserver` only when explicit dimensions are absent.
- Turns parser, normalization, and render errors into a visible localized fallback plus `onStatus`.
- Disables animation while streaming or when reduced motion is preferred.
- Exposes zoom only for relationship and tree charts.
- Does not duplicate roots or observers under React Strict Mode.

### 4.4 React Behavior

- React 18 and 19 are supported.
- `GPTVisChart` renders directly without nesting another root inside a component.
- The imperative API is an adapter around the same React tree.
- New data for the same type updates the tree.
- Changing chart family replaces the renderer.

## 5. Parsing and Streaming

- Parser accepts `key value`, `key: value`, and `key=value`.
- Array sections are `data`, `categories`, `series`, `children`, `nodes`, and `edges`.
- Object sections include `style`.
- Quoted values remain strings; unquoted finite numbers and booleans are coerced.
- Nested `children` and `data` arrays are supported.
- Fenced `vis` blocks are accepted.
- JSON configuration may be an object or a JSON string.
- Text that is not `vis` or JSON chart input is rendered as `summary`.

When `streaming` is enabled:

- The unfinished trailing line is discarded.
- Completed lines continue to render.
- A partial `vis` prefix yields `pending`, not an error.
- Equivalent complete input does not remount the chart unnecessarily.

## 6. Normalized Models

Normalization is tolerant of model output but strict about unsafe or meaningless values.

Common rules:

- Titles and labels are strings.
- Data values are finite numbers unless a type declares otherwise.
- Rows missing required fields are dropped.
- Category, series, and node order follows first appearance.
- Empty data yields an accessible empty state, not a crash.
- A supported type without usable data is `ready` with an empty-state message, except while streaming, where it may be `pending`.
- Repeated observations are pivoted into one row per primary category and one series per group.
- Multi-series charts infer groups from the `group` field even when `group: true` is absent.

Type contracts:

- `line`, `area`: `{ time, value, group? }`; `area` supports `stack`.
- `column`, `bar`: `{ category, value, group? }`; support `group`, `stack`, and `label`.
- `pie`: `{ category, value }`; `innerRadius` is clamped to `0..1`.
- `scatter`: `{ x, y, group? }`.
- `radar`: `{ name, value, group? }`; supports `align`.
- `funnel`: `{ category, value }`; supports `conversionRateLabel`.
- `waterfall`: `{ category, value?, isTotal?, isIntermediateTotal? }`.
- `dual-axes`: `categories: string[]` and `series: { type: 'line' | 'column'; data: number[]; axisYTitle?: string }[]`.
- `histogram`: `number[]` plus optional `binNumber`.
- `boxplot`, `violin`: repeated `{ category, value, group? }`.
- `venn`: `{ sets: string | string[], value, label? }`.
- `sankey`: `{ source, target, value }[]` plus `nodeAlign`.
- `treemap`: nested `{ name, value, children? }`.
- `word-cloud`: `{ text, value }[]`.
- `liquid`: `percent` clamped to `0..1` and optional `shape`.
- `flow-diagram`, `network-graph`: `{ nodes: { name }[], edges: { source, target, name? }[] }`.
- `network-graph` also supports `layout`.
- `mindmap`, `indented-tree`: one tree root `{ name, children? }` plus `direction`.
- `organization-chart`: one tree root `{ name, description?, children? }`.
- `fishbone-diagram`: one tree root `{ name, children? }`.
- `table`: `Record<string, unknown>[]`.
- `summary`: plain text, T8-like markdown, or an object `{ type: 'summary', content: string }`.

Quartiles, whiskers, densities, and histogram bins are computed by the adapter. Model-supplied statistics are not trusted.

Object configurations for `mindmap`, `indented-tree`, `organization-chart`, and `fishbone-diagram` use a single root object, matching GPT-Vis. Syntax parsing may produce either that object or a one-element array because the `data` section can be written as a bullet list. Normalization accepts both forms and always emits `{ root }`. An array containing more than one root is a validation error. `treemap` is the only hierarchy type that accepts multiple roots.

## 7. Renderers

### 7.1 Shared Recharts Components

Recharts renderers share:

- Cartesian axes and grid styling.
- Tooltips and their theme colors.
- Legends.
- Value labels.
- Empty states.
- Title and subtitle framing.

`ResponsiveContainer` is used unless explicit dimensions are supplied. Recharts accessibility layers are enabled where supported.

### 7.2 Native Recharts Charts

- `line` and `area` pivot by `group`, preserve order, and use one mark per group.
- `column` and `bar` support grouped and stacked modes. `bar` uses vertical layout and keeps the first category at the top.
- `pie` supports donuts and category/value labels.
- `scatter` renders one series per group.
- `radar` pivots names into axes and groups into polygons.
- `funnel` preserves stage order and reports conversion context in labels or tooltips.
- `waterfall` computes running totals and draws floating positive, negative, total, and intermediate-total segments.
- `dual-axes` uses a composed chart with independent left and right Y axes.
- `histogram` computes equal-width bins and renders counts.
- `sankey` maps node names to stable indexes and renders weighted links.
- `treemap` renders nested nodes with palette colors and accessible labels.

### 7.3 Custom Statistical Renderers

`boxplot` and `violin` use the shared SVG cartesian helper rather than Recharts custom marks. This keeps Quartile and density geometry deterministic and avoids depending on Recharts internals for axis scale access:

- Boxplots show whiskers, quartile box, median, and outliers.
- Violins show mirrored Gaussian-kernel density plus median and quartile markers.
- Grouped variants share the category axis and color by group.

### 7.4 SVG and HTML Renderers

- `liquid`: shape-masked SVG wave, clamped percentage, static under reduced motion.
- `venn`: stable two- or three-set geometry, labels, and intersection values.
- `word-cloud`: deterministic seeded spiral, top 50 words, collision avoidance, accessible text list.
- `flow-diagram`: left-to-right layered DAG with arrowheads and optional edge labels.
- `network-graph`: stable layouts for `force`, `circular`, `grid`, `radial`, `concentric`, and `dagre`.
- `mindmap`: root-centered two-sided default; `LR` and `RL` are one-sided.
- `indented-tree`: accessible nested HTML list with connector styling and `LR`, `RL`, `H` orientation.
- `organization-chart`: top-down SVG tree with name and description boxes.
- `fishbone-diagram`: result on the right, first-level causes alternating above and below the spine.
- `table`: responsive HTML table with sticky headers.
- `summary`: safe React rendering of headings, paragraphs, lists, emphasis, code, semantic entity chips, and inline sparklines for detail arrays. Supported entity types and inline syntax follow the upstream GPT-Vis summary contract: `metric_name`, `metric_value`, `other_metric_value`, `delta_value`, `ratio_value`, `contribute_ratio`, `proportion`, `trend_desc`, `dim_value`, `time_desc`, `rank`, `difference`, `anomaly`, `association`, `distribution`, and `seasonality`.

Layouts are deterministic for identical input.

## 8. Themes

Supported names:

- Core: `default`, `light`, `dark`, `academy`.
- Gallery: `gpt-vis`, `midnight`, `paper`, `product`, `neon-circuit`, `terra-print`, `mono-signal`, `candy-pop`, `pop`, `bauhaus`.
- Inline `ThemeSpec` with `id`, `label`, `description?`, `baseTheme?`, `tokens?`, `style?`, and `charts?`.

Each theme resolves to:

- Background, text, muted text, grid, border, and tooltip colors.
- Categorical palette.
- Positive, negative, and total semantic colors.
- Font family, font size, line height, radius, spacing, and line width.

Precedence:

1. Built-in defaults.
2. Theme tokens.
3. Global `ThemeSpec.style`.
4. `charts[type].style`.
5. Per-render chart `style`.

Arrays replace, objects merge. A per-render `theme` replaces the constructor theme. Unknown style fields are ignored.

## 9. Wrapper

When enabled, the wrapper provides:

- Chart and source tabs.
- Copy-source action.
- Download when the output contains an exportable SVG; HTML-only charts omit the action rather than showing a failing control.
- Zoom controls for relationship and tree charts.

The wrapper defaults to off. Locale defaults to `en-US`; `zh-CN` is supported. Copy uses the Clipboard API with a safe fallback. Download export failures must not affect chart rendering.

## 10. Status, Errors, and Limits

`RenderStatus.state` is `pending`, `ready`, `unsupported`, or `error`.

- Incomplete input: `pending`.
- Supported chart with data: `ready`.
- Known chart with no usable data: `ready` and an empty state.
- Unknown type: `unsupported`.
- Exception: `error`.

Visible errors are localized and do not expose stack traces.

Limits:

- 10,000 data rows.
- 250 graph or tree nodes and 1,000 edges.
- 50 word-cloud entries.
- Tree depth 20.
- 20 series or groups.
- 500 characters for title and subtitle.
- 2,000 characters for a label.

Limit violations produce a localized error instead of partial rendering.

## 11. Security

- Model output cannot provide components, HTML, JavaScript, handlers, selectors, or arbitrary Recharts props.
- All text renders through React text nodes.
- No `dangerouslySetInnerHTML` or model-derived `innerHTML`.
- Colors are validated CSS colors.
- Numeric values are finite and clamped where required.
- Edges may only reference declared graph nodes.
- Summary links are not navigable; semantic entities become non-link chips.
- Labels are never used as selectors.
- Record keys such as `__proto__` are data and must not mutate prototypes.
- Download serialization escapes XML-sensitive values.

## 12. Packaging

`packages/gptvis-recharts/package.json`:

- Name `gptvis-recharts`.
- ESM package with `exports` for `.`, `./react`, and `./syntax`.
- `files`: `dist`, `src`, `skills`.
- Peers: `recharts: ^3.10.0`, `react: >=18`, `react-dom: >=18`.
- Development and CI use Recharts `3.10.1`, the current stable release at implementation time, as the tested target.
- Node `>=20`.
- Tree-shakable syntax entry.

No CommonJS build is required for v1.

## 13. Playground

The Vite playground provides:

- Editable syntax textarea.
- Live preview.
- Examples for all 26 types.
- Theme picker.
- Object/syntax mode toggle.
- Streaming simulation.
- Status display.
- Wrapper toggle.

Default URL: `http://127.0.0.1:4318`.

## 14. Verification

Parser tests:

- Key/value forms, quoted strings, object arrays, scalar arrays, nested children, dual-axis nested data, fences, and streaming truncation.
- `readConfig` for objects, JSON, plain text, and incomplete input.

Model and safety tests:

- Catalog has 26 unique types.
- Every normalizer handles valid and invalid input.
- Grouped pivots, waterfall totals, histogram bins, distribution statistics, graph validation, and limits.
- Theme precedence, gallery names, tokens, and color rejection.
- HTML-like labels, hostile colors, prototype keys, and unsupported fields.

React and runtime tests:

- Render smoke tests for all 26 types.
- Imperative mount, update, type switch, resize, zoom, and destroy.
- React content updates and status callbacks.
- Streaming pending/ready transitions.
- Empty, unknown, and error states.
- Wrapper tabs and copy with mocked browser APIs.

Integration tests:

- TypeScript check for library and playground.
- Production builds.
- Export checks for `.`, `./react`, and `./syntax`.
- Node import of `gptvis-recharts/syntax` without DOM globals.
- Server render of `GPTVisChart` without `window`.
- Playwright smoke test of the playground with screenshots for representative families.

Acceptance criteria:

- `npm test` passes.
- `npm run typecheck` passes.
- `npm run build` succeeds.
- All 26 types render from syntax and object input.
- Representative GPT-Vis syntax from the upstream chart skill runs unchanged.
- Syntax entry loads without React, React DOM, Recharts, or DOM globals.
- Public types do not require `any`.
- Model-supplied content cannot execute code.

## 15. Documentation

Root and package READMEs cover:

- Installation with peers.
- Imperative, React, and syntax-only usage.
- Streaming.
- Themes and ThemeSpec.
- Constructors.
- Wrapper and locale.
- Renderer support matrix.
- Security and limits.
- Playground commands.

The bundled chart skill mirrors GPT-Vis selection guidance with Recharts-specific support notes.

## 16. Attribution

The package is MIT licensed. The `vis` grammar originates from AntV GPT-Vis. Parser, compatibility, and skill work preserve attribution in `README.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` where required. Recharts remains an external peer and is not vendored.

## 17. Risks

- Recharts differs across 3.x minors: test the supported peer range and avoid private internals.
- Hidden containers can measure zero: show an accessible empty state and support `resize`.
- Custom SVG can diverge visually: share theme tokens, frame, typography, and spacing.
- Large input can stall layout: enforce limits before normalization.
- Streaming can flicker: keep completed models stable and disable transitions while streaming.
- Recharts SSR may touch browser globals: isolate syntax-only code and test Node imports.

## 18. Delivery Sequence

1. Workspace, metadata, parser, catalog, and type skeleton.
2. Theme resolver and shared frame, status, and empty components.
3. Imperative and React runtime with streaming.
4. Recharts statistical renderers.
5. Recharts relationship and text-friendly renderers.
6. SVG and HTML fallback renderers.
7. Wrapper, download, zoom, and localization.
8. Playground and all 26 examples.
9. Tests, package checks, browser verification, and documentation.

Every step leaves the package buildable and testable.
