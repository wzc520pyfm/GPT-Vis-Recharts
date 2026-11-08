import type { CSSProperties } from 'react';
import type { TreeModel, TreeNode } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';

function TreeNodeView({
  node,
  depth,
  color,
  direction,
  theme,
}: {
  node: TreeNode;
  depth: number;
  color: string;
  direction: TreeModel['direction'];
  theme: TreeModel['theme'];
}) {
  const children = node.children ?? [];
  return (
    <li
      role="treeitem"
      aria-level={depth + 1}
      style={{
        listStyle: 'none',
        margin: 0,
        paddingInlineStart: 18,
        position: 'relative',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          margin: '4px 0',
          padding: depth === 0 ? '7px 12px' : '4px 8px',
          borderRadius: depth === 0 ? 8 : 5,
          background: depth === 0 ? color : `${color}16`,
          color: depth === 0 ? '#ffffff' : theme.text,
          border: `1px solid ${depth === 0 ? color : `${color}55`}`,
          fontWeight: depth === 0 ? 700 : 550,
          maxWidth: 520,
          overflowWrap: 'anywhere',
        }}
      >
        <span aria-hidden="true" style={{ opacity: 0.7 }}>
          {children.length ? '▾' : '•'}
        </span>
        {node.name}
      </span>
      {node.description && (
        <span
          style={{
            marginInlineStart: 8,
            color: theme.muted,
            fontSize: 11,
          }}
        >
          {node.description}
        </span>
      )}
      {children.length > 0 && (
        <ul
          role="group"
          style={{
            margin: 0,
            padding: 0,
            borderInlineStart: `1px solid ${theme.border}`,
            marginInlineStart: 12,
          }}
        >
          {children.map((child) => (
            <TreeNodeView
              key={child.name}
              node={child}
              depth={depth + 1}
              color={color}
              direction={direction}
              theme={theme}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function IndentedTreeView({ model }: { model: TreeModel }) {
  const theme = model.theme;
  const style: CSSProperties = {
    height: '100%',
    minHeight: 220,
    overflow: 'auto',
    padding: '8px 4px 20px',
    direction: model.direction === 'RL' ? 'rtl' : 'ltr',
    textAlign: model.direction === 'H' ? 'center' : model.direction === 'RL' ? 'right' : 'left',
    fontFamily: theme.fontFamily,
    color: theme.text,
  };
  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme} bodyStyle={{ overflow: 'hidden' }}>
      <div style={style}>
        <ul role="tree" aria-label={model.title || 'Indented tree'} style={{ margin: 0, padding: 0 }}>
          <TreeNodeView
            node={model.root}
            depth={0}
            color={theme.total}
            direction={model.direction}
            theme={theme}
          />
        </ul>
      </div>
    </ChartFrame>
  );
}
