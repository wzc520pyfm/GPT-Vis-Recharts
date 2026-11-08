import type { TableModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';

export function TableView({ model }: { model: TableModel }) {
  const theme = model.theme;
  const minWidth = Math.max(320, model.columns.length * 132);
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
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radius,
          background: theme.background,
        }}
      >
        <table
          aria-label={model.title || 'Data table'}
          style={{
            width: '100%',
            minWidth,
            borderCollapse: 'separate',
            borderSpacing: 0,
            color: theme.text,
            fontFamily: theme.fontFamily,
            fontSize: Math.max(11, theme.fontSize - 1),
            lineHeight: 1.5,
          }}
        >
          <thead>
            <tr>
              {model.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    padding: '9px 12px',
                    textAlign: 'left',
                    verticalAlign: 'bottom',
                    whiteSpace: 'nowrap',
                    background: theme.background,
                    color: theme.text,
                    borderBottom: `1px solid ${theme.border}`,
                    fontWeight: 650,
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  background:
                    rowIndex % 2 === 0
                      ? 'transparent'
                      : `color-mix(in srgb, ${theme.muted} 6%, ${theme.background})`,
                }}
              >
                {model.columns.map((column) => (
                  <td
                    key={column}
                    style={{
                      padding: '8px 12px',
                      verticalAlign: 'top',
                      borderBottom:
                        rowIndex === model.rows.length - 1
                          ? 'none'
                          : `1px solid color-mix(in srgb, ${theme.border} 58%, transparent)`,
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      maxWidth: 360,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row[column] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
