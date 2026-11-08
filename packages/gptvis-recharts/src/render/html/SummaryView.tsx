import type { CSSProperties, ReactNode } from 'react';
import type { SummaryModel } from '../../build/types.js';
import type { ResolvedTheme } from '../../types/theme.js';
import { ChartFrame } from '../Frame.js';
import {
  parseSummary,
  type SummaryBlock,
  type SummaryDetail,
  type SummaryEntity,
  type SummaryEntityType,
  type SummaryInline,
} from './summary-parser.js';

function tint(color: string, theme: ResolvedTheme): string {
  return `color-mix(in srgb, ${color} 16%, ${theme.background})`;
}

function entityTone(entity: SummaryEntity, theme: ResolvedTheme): string {
  if (entity.assessment === 'positive') return theme.positive;
  if (entity.assessment === 'negative') return theme.negative;
  if (entity.assessment === 'equal') return theme.muted;
  const tones: Record<SummaryEntityType, string> = {
    metric_name: theme.palette[0] ?? theme.total,
    metric_value: theme.palette[0] ?? theme.total,
    other_metric_value: theme.palette[1] ?? theme.total,
    delta_value: theme.palette[2] ?? theme.total,
    ratio_value: theme.palette[3] ?? theme.palette[0] ?? theme.total,
    contribute_ratio: theme.palette[4] ?? theme.palette[0] ?? theme.total,
    proportion: theme.palette[5] ?? theme.palette[0] ?? theme.total,
    trend_desc: theme.palette[0] ?? theme.total,
    dim_value: theme.palette[1] ?? theme.total,
    time_desc: theme.muted,
    rank: theme.palette[2] ?? theme.total,
    difference: theme.palette[3] ?? theme.total,
    anomaly: theme.negative,
    association: theme.palette[4] ?? theme.total,
    distribution: theme.palette[5] ?? theme.total,
    seasonality: theme.palette[6] ?? theme.palette[0] ?? theme.total,
  };
  return tones[entity.entityType];
}

function numericSeries(detail: SummaryDetail | undefined): number[] {
  if (!detail) return [];
  if (Array.isArray(detail)) {
    if (!detail.length) return [];
    return typeof detail[0] === 'number'
      ? (detail as number[])
      : (detail as Array<{ x: number; y: number }>).map((point) => point.y);
  }
  return detail.data;
}

function Sparkline({ detail, color }: { detail: SummaryDetail; color: string }) {
  if (Array.isArray(detail) && detail.length && typeof detail[0] !== 'number') {
    const points = detail as Array<{ x: number; y: number }>;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return (
      <svg width="64" height="20" viewBox="0 0 64 20" aria-hidden="true" style={{ flex: '0 0 auto' }}>
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={3 + ((point.x - minX) / Math.max(1, maxX - minX)) * 58}
            cy={17 - ((point.y - minY) / Math.max(1, maxY - minY)) * 14}
            r="1.7"
            fill={color}
            fillOpacity="0.75"
          />
        ))}
      </svg>
    );
  }

  const values = numericSeries(detail);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const path = values
    .map((value, index) => {
      const x = 2 + (index / (values.length - 1)) * 60;
      const y = max === min ? 10 : 17 - ((value - min) / (max - min)) * 14;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width="64" height="20" viewBox="0 0 64 20" aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function InlineNodes({
  nodes,
  theme,
}: {
  nodes: SummaryInline[];
  theme: ResolvedTheme;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.kind === 'text') return <span key={index}>{node.text}</span>;
        if (node.kind === 'strong') {
          return (
            <strong key={index} style={{ fontWeight: 700, color: theme.text }}>
              <InlineNodes nodes={node.children} theme={theme} />
            </strong>
          );
        }
        if (node.kind === 'code') {
          return (
            <code
              key={index}
              style={{
                padding: '1px 5px',
                borderRadius: 4,
                background: tint(theme.muted, theme),
                color: theme.text,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.9em',
              }}
            >
              {node.text}
            </code>
          );
        }
        const tone = entityTone(node, theme);
        return (
          <span
            key={index}
            data-entity-type={node.entityType}
            title={
              node.origin === undefined
                ? node.text
                : `${node.text} (origin: ${node.origin}${node.unit ?? ''})`
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              margin: '0 1px',
              padding: '0 5px',
              borderRadius: 999,
              border: `1px solid ${tint(tone, theme)}`,
              background: tint(tone, theme),
              color: theme.text,
              fontWeight:
                node.entityType.endsWith('value') ||
                node.entityType === 'rank' ||
                node.entityType === 'ratio_value'
                  ? 650
                  : 550,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              lineHeight: 1.55,
            }}
          >
            <span>{node.text}</span>
            {node.detail && <Sparkline detail={node.detail} color={tone} />}
          </span>
        );
      })}
    </>
  );
}

function headingStyle(level: number, theme: ResolvedTheme): CSSProperties {
  const size = level === 1 ? 22 : level === 2 ? 17 : level === 3 ? 14 : 13;
  return {
    margin: level === 1 ? '2px 0 10px' : '16px 0 7px',
    color: theme.text,
    fontSize: size,
    lineHeight: 1.35,
    fontWeight: level <= 2 ? 700 : 650,
    letterSpacing: 0,
  };
}

function Block({
  block,
  theme,
}: {
  block: SummaryBlock;
  theme: ResolvedTheme;
}) {
  if (block.kind === 'heading') {
    const Tag = `h${Math.min(6, Math.max(1, block.level))}` as 'h1';
    return (
      <Tag style={headingStyle(block.level, theme)}>
        <InlineNodes nodes={block.inlines} theme={theme} />
      </Tag>
    );
  }
  if (block.kind === 'code') {
    return (
      <pre
        style={{
          margin: '10px 0',
          padding: '10px 12px',
          overflow: 'auto',
          borderRadius: theme.radius,
          border: `1px solid ${theme.border}`,
          background: tint(theme.muted, theme),
          color: theme.text,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        <code>{block.code}</code>
      </pre>
    );
  }
  if (block.kind === 'list') {
    const content: ReactNode[] = block.items.map((item, index) => (
      <li key={index} style={{ margin: '3px 0', paddingInlineStart: 2 }}>
        <InlineNodes nodes={item} theme={theme} />
      </li>
    ));
    const style: CSSProperties = {
      margin: '8px 0',
      paddingInlineStart: 22,
      color: theme.text,
    };
    return block.ordered ? <ol style={style}>{content}</ol> : <ul style={style}>{content}</ul>;
  }
  return (
    <p
      style={{
        margin: '8px 0',
        color: theme.text,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
      }}
    >
      <InlineNodes nodes={block.inlines} theme={theme} />
    </p>
  );
}

export function SummaryView({ model }: { model: SummaryModel }) {
  const theme = model.theme;
  const blocks = parseSummary(model.content);
  return (
    <ChartFrame
      title={model.title}
      subtitle={model.subtitle}
      theme={theme}
      bodyStyle={{ overflow: 'hidden' }}
    >
      <div
        style={{
          height: '100%',
          minHeight: 220,
          overflow: 'auto',
          padding: '2px 4px 18px',
          color: theme.text,
          fontFamily: theme.fontFamily,
          fontSize: Math.max(13, theme.fontSize),
          lineHeight: Math.max(1.7, theme.lineHeight),
        }}
      >
        {blocks.map((block, index) => (
          <Block key={index} block={block} theme={theme} />
        ))}
      </div>
    </ChartFrame>
  );
}
