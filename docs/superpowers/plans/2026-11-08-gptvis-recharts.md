# GPT-Vis Recharts Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development if subagents are available, or execute this plan directly with checkpoint verification. Steps use checkbox syntax for tracking.

**Goal:** Build a publishable `gptvis-recharts` package that renders all 26 GPT-Vis chart types from object or streaming `vis` syntax input.

**Architecture:** A shared parser and normalization layer produces discriminated chart models. Recharts renders native statistical charts, while shared SVG and HTML renderers cover Recharts gaps. One React view is used by both `GPTVisChart` and the imperative `GPTVis` runtime.

**Tech Stack:** TypeScript, React 18/19, Recharts 3.10, Vitest, Testing Library, Vite, npm workspaces.

---

## Task 1: Workspace And Package Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `packages/gptvis-recharts/package.json`
- Create: `packages/gptvis-recharts/tsconfig.json`
- Create: `packages/gptvis-recharts/tsconfig.check.json`
- Create: `packages/gptvis-recharts/vitest.config.ts`
- Create: `playground/package.json`
- Create: `playground/tsconfig.json`
- Create: `playground/vite.config.ts`

- [ ] Create the npm workspace and package metadata.
- [ ] Install dependencies with npm.
- [ ] Add a source entry that exports a version marker.
- [ ] Run `npm run typecheck` and verify the empty workspace compiles.

## Task 2: Parser, Catalog, And Public Contracts

**Files:**
- Create: `packages/gptvis-recharts/src/parser.ts`
- Create: `packages/gptvis-recharts/src/catalog.ts`
- Create: `packages/gptvis-recharts/src/types/charts.ts`
- Create: `packages/gptvis-recharts/src/types/theme.ts`
- Create: `packages/gptvis-recharts/src/syntax.ts`
- Create: `packages/gptvis-recharts/src/index.ts`
- Test: `packages/gptvis-recharts/tests/parser.test.ts`
- Test: `packages/gptvis-recharts/tests/catalog.test.ts`

- [ ] Write parser tests for all value, list, tree, style, fence, JSON, and streaming cases.
- [ ] Implement the parser and `readConfig`.
- [ ] Define all 26 chart configuration and data types.
- [ ] Add the 26-entry catalog.
- [ ] Verify parser tests pass and the syntax entry has no React imports.

## Task 3: Theme Resolution

**Files:**
- Create: `packages/gptvis-recharts/src/theme/presets.ts`
- Create: `packages/gptvis-recharts/src/theme/merge.ts`
- Create: `packages/gptvis-recharts/src/theme/resolve.ts`
- Create: `packages/gptvis-recharts/src/theme/index.ts`
- Test: `packages/gptvis-recharts/tests/theme.test.ts`

- [ ] Write tests for core themes, gallery themes, tokens, precedence, arrays, and unsafe colors.
- [ ] Implement theme presets and ThemeSpec resolution.
- [ ] Export `resolveTheme`, `safeColor`, and theme types.
- [ ] Verify theme tests pass.

## Task 4: Normalization And Model Builders

**Files:**
- Create: `packages/gptvis-recharts/src/build/shared.ts`
- Create: `packages/gptvis-recharts/src/build/cartesian.ts`
- Create: `packages/gptvis-recharts/src/build/composition.ts`
- Create: `packages/gptvis-recharts/src/build/distribution.ts`
- Create: `packages/gptvis-recharts/src/build/hierarchy.ts`
- Create: `packages/gptvis-recharts/src/build/text.ts`
- Create: `packages/gptvis-recharts/src/build/index.ts`
- Test: `packages/gptvis-recharts/tests/build.test.ts`

- [ ] Write normalizer tests for grouped pivots, waterfall totals, histogram bins, distribution statistics, graphs, trees, tables, and limits.
- [ ] Implement validation helpers, limits, grouping, pivots, and sequence helpers.
- [ ] Implement all type-specific model builders.
- [ ] Implement `buildView`, pending, empty, unsupported, and error states.
- [ ] Verify model tests pass.

## Task 5: Shared React Frame And Recharts Primitives

**Files:**
- Create: `packages/gptvis-recharts/src/render/Frame.tsx`
- Create: `packages/gptvis-recharts/src/render/ChartTooltip.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/axis.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/ChartSurface.tsx`
- Create: `packages/gptvis-recharts/src/render/StatusView.tsx`
- Create: `packages/gptvis-recharts/src/render/styles.ts`
- Test: `packages/gptvis-recharts/tests/frame.test.tsx`

- [ ] Implement title, subtitle, background, empty state, and status views.
- [ ] Implement theme-aware tooltip, grid, axis, and legend defaults.
- [ ] Verify frame tests and accessibility labels.

## Task 6: Recharts Statistical Renderers

**Files:**
- Create: `packages/gptvis-recharts/src/render/recharts/LineView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/AreaView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/BarView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/PieView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/ScatterView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/RadarView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/FunnelView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/WaterfallView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/DualAxesView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/HistogramView.tsx`
- Test: `packages/gptvis-recharts/tests/recharts-smoke.test.tsx`

- [ ] Implement line, area, column, bar, pie, scatter, radar, funnel, waterfall, dual-axes, and histogram.
- [ ] Add one render smoke test per type with jsdom size stubs.
- [ ] Verify all Recharts statistical smoke tests pass.

## Task 7: Recharts Treemap And Sankey

**Files:**
- Create: `packages/gptvis-recharts/src/render/recharts/TreemapView.tsx`
- Create: `packages/gptvis-recharts/src/render/recharts/SankeyView.tsx`
- Modify: `packages/gptvis-recharts/tests/recharts-smoke.test.tsx`

- [ ] Implement nested treemap content with palette and labels.
- [ ] Implement Sankey node indexing, links, node alignment, and safe tooltips.
- [ ] Add smoke tests for both types and verify.

## Task 8: Shared SVG Cartesian Helper

**Files:**
- Create: `packages/gptvis-recharts/src/render/svg/scale.ts`
- Create: `packages/gptvis-recharts/src/render/svg/SvgCartesianChart.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/SvgSurface.tsx`
- Test: `packages/gptvis-recharts/tests/svg-scale.test.ts`

- [ ] Implement nice ticks, linear scales, margins, axes, grid, and SVG titles.
- [ ] Implement responsive `viewBox` surfaces and accessible descriptions.
- [ ] Verify scale and axis tests.

## Task 9: Distribution SVG Renderers

**Files:**
- Create: `packages/gptvis-recharts/src/render/svg/BoxplotView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/ViolinView.tsx`
- Modify: `packages/gptvis-recharts/src/build/distribution.ts`
- Test: `packages/gptvis-recharts/tests/distribution.test.tsx`

- [ ] Implement quartiles, whiskers, outlier marks, and grouped boxplots.
- [ ] Implement deterministic kernel density and mirrored violin paths.
- [ ] Verify both render and statistics tests.

## Task 10: Relationship And Hierarchy Renderers

**Files:**
- Create: `packages/gptvis-recharts/src/render/svg/VennView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/LiquidView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/FlowView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/NetworkView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/MindmapView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/OrganizationView.tsx`
- Create: `packages/gptvis-recharts/src/render/svg/FishboneView.tsx`
- Create: `packages/gptvis-recharts/src/render/html/IndentedTreeView.tsx`
- Test: `packages/gptvis-recharts/tests/relationships.test.tsx`

- [ ] Implement deterministic layouts for every relationship layout mode.
- [ ] Implement Venn, liquid, flow, network, mindmap, organization, indented tree, and fishbone views.
- [ ] Verify smoke tests for all graph families.

## Task 11: Text And Table Renderers

**Files:**
- Create: `packages/gptvis-recharts/src/render/svg/WordCloudView.tsx`
- Create: `packages/gptvis-recharts/src/render/html/TableView.tsx`
- Create: `packages/gptvis-recharts/src/render/html/SummaryView.tsx`
- Create: `packages/gptvis-recharts/src/render/html/summary-parser.ts`
- Test: `packages/gptvis-recharts/tests/text.test.tsx`

- [ ] Implement deterministic word-cloud layout and accessible word list.
- [ ] Implement table column discovery, typed cells, and sticky headers.
- [ ] Implement safe summary blocks, semantic chips, and detail sparklines.
- [ ] Verify text and XSS safety tests.

## Task 12: Renderer Registry And Runtime

**Files:**
- Create: `packages/gptvis-recharts/src/render/VisRenderer.tsx`
- Create: `packages/gptvis-recharts/src/runtime.ts`
- Create: `packages/gptvis-recharts/src/react.tsx`
- Test: `packages/gptvis-recharts/tests/runtime.test.tsx`

- [ ] Implement the model-to-renderer registry.
- [ ] Implement imperative mount, render, resize, zoom, status, streaming, and destroy.
- [ ] Implement `GPTVisChart` with content updates and cleanup.
- [ ] Verify runtime and React tests.

## Task 13: Constructors, Wrapper, And Localization

**Files:**
- Create: `packages/gptvis-recharts/src/charts.ts`
- Create: `packages/gptvis-recharts/src/wrapper/Wrapper.tsx`
- Create: `packages/gptvis-recharts/src/wrapper/download.ts`
- Create: `packages/gptvis-recharts/src/wrapper/locale.ts`
- Modify: `packages/gptvis-recharts/src/index.ts`
- Test: `packages/gptvis-recharts/tests/public-api.test.tsx`

- [ ] Implement all 26 constructors and `bindGPTVis`.
- [ ] Implement chart/source tabs, copy, SVG download, zoom, and locale strings.
- [ ] Verify public API and wrapper tests.

## Task 14: Playground

**Files:**
- Create: `playground/index.html`
- Create: `playground/src/main.tsx`
- Create: `playground/src/App.tsx`
- Create: `playground/src/examples.ts`
- Create: `playground/src/styles.css`

- [ ] Build the editable preview with all 26 examples, themes, streaming, wrapper, and status.
- [ ] Verify `npm run dev` serves the playground at `http://127.0.0.1:4318`.

## Task 15: Documentation, Package Checks, And Final Verification

**Files:**
- Create: `README.md`
- Create: `packages/gptvis-recharts/README.md`
- Create: `packages/gptvis-recharts/THIRD_PARTY_NOTICES.md`
- Create: `packages/gptvis-recharts/skills/chart-visualization/SKILL.md`
- Create: `packages/gptvis-recharts/scripts/check-package.mjs`
- Modify: root scripts

- [ ] Write installation, API, streaming, theme, wrapper, support-matrix, security, and playground docs.
- [ ] Add the chart skill and upstream attribution.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, and package export checks.
- [ ] Run the playground and verify representative screenshots for all chart families.

## Final Verification

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Node import of `gptvis-recharts/syntax` without DOM globals
- [ ] Playground renders every example without console errors
