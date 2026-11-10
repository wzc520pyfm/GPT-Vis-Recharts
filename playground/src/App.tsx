import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GPTVisChart,
  THEME_NAMES,
  type ChartType,
  type RenderStatus,
  type ThemeName,
} from 'gptvis-recharts';
import { EXAMPLES, GROUPS } from './examples.js';

type Mode = 'syntax' | 'object';

const STATUS_LABEL: Record<RenderStatus['state'], string> = {
  pending: 'Pending',
  ready: 'Ready',
  unsupported: 'Unsupported',
  error: 'Error',
};

function prettyObject(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

export function App() {
  const [selected, setSelected] = useState<ChartType>('line');
  const [mode, setMode] = useState<Mode>('syntax');
  const [source, setSource] = useState(EXAMPLES[0]?.syntax ?? '');
  const [theme, setTheme] = useState<ThemeName>('default');
  const [locale, setLocale] = useState('zh-CN');
  const [wrapper, setWrapper] = useState(false);
  const [status, setStatus] = useState<RenderStatus>({
    state: 'pending',
    message: 'Waiting for chart input…',
  });
  const [streamText, setStreamText] = useState<string | null>(null);
  const streamRef = useRef<string | null>(null);

  const active = useMemo(
    () => EXAMPLES.find((item) => item.type === selected) ?? EXAMPLES[0],
    [selected],
  );

  useEffect(() => {
    if (!active) return;
    setStreamText(null);
    streamRef.current = null;
    setSource(mode === 'syntax' ? active.syntax : prettyObject(active.object));
  }, [active, mode]);

  useEffect(() => {
    if (streamText === null) return;
    if (streamText.length >= source.length) {
      const timer = window.setTimeout(() => {
        setStreamText(null);
        streamRef.current = null;
      }, 160);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setStreamText(source.slice(0, streamText.length + 7));
    }, 28);
    return () => window.clearTimeout(timer);
  }, [source, streamText]);

  const parsed = useMemo(() => {
    if (mode === 'syntax') return { value: source as string | Record<string, unknown>, error: '' };
    try {
      const value = JSON.parse(source) as unknown;
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { value: {}, error: 'Object mode requires a JSON object.' };
      }
      return { value: value as Record<string, unknown>, error: '' };
    } catch {
      return { value: {} as Record<string, unknown>, error: 'Invalid JSON object.' };
    }
  }, [mode, source]);

  const isStreaming = streamText !== null;
  const chartContent = isStreaming ? streamText : parsed.error ? '' : parsed.value;
  const activeLabel = active?.label ?? 'Visualization';

  const startStream = () => {
    if (!source) return;
    streamRef.current = '';
    setStreamText('');
  };

  const resetSource = () => {
    if (!active) return;
    setSource(mode === 'syntax' ? active.syntax : prettyObject(active.object));
    setStreamText(null);
    streamRef.current = null;
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <div>
            <strong>GPT-Vis Recharts</strong>
            <small>26 chart types · vis syntax</small>
          </div>
        </div>

        <nav aria-label="Chart examples" className="example-nav">
          {GROUPS.map((group) => (
            <section key={group} className="example-group">
              <h2>{group}</h2>
              <div className="example-list">
                {EXAMPLES.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={item.type === selected ? 'example active' : 'example'}
                    aria-pressed={item.type === selected}
                    onClick={() => setSelected(item.type)}
                  >
                    <span>{item.label}</span>
                    <code>{item.type}</code>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>
            <a href="https://github.com/wzc520pyfm/GPT-Vis-Recharts" target="_blank" rel="noreferrer">
              GitHub
            </a>
            {' · '}
            <a href="https://github.com/antvis/GPT-Vis" target="_blank" rel="noreferrer">
              GPT-Vis
            </a>
          </span>
          <span>Recharts 3.10</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Playground</p>
            <h1>{activeLabel}</h1>
            <p className="description">{active?.note}</p>
          </div>
          <div className="topbar-actions">
            <label className="field compact">
              <span>Theme</span>
              <select value={theme} onChange={(event) => setTheme(event.target.value as ThemeName)}>
                {THEME_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field compact">
              <span>Locale</span>
              <select value={locale} onChange={(event) => setLocale(event.target.value)}>
                <option value="zh-CN">zh-CN</option>
                <option value="en-US">en-US</option>
              </select>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={wrapper}
                onChange={(event) => setWrapper(event.target.checked)}
              />
              <span>Wrapper</span>
            </label>
          </div>
        </header>

        <div className="main-grid">
          <section className="editor-panel" aria-label="Chart source editor">
            <div className="panel-heading">
              <div className="segmented" role="group" aria-label="Input mode">
                <button
                  type="button"
                  className={mode === 'syntax' ? 'active' : ''}
                  aria-pressed={mode === 'syntax'}
                  onClick={() => setMode('syntax')}
                >
                  vis syntax
                </button>
                <button
                  type="button"
                  className={mode === 'object' ? 'active' : ''}
                  aria-pressed={mode === 'object'}
                  onClick={() => setMode('object')}
                >
                  JSON object
                </button>
              </div>
              <div className="editor-actions">
                <button type="button" className="ghost" onClick={resetSource}>
                  Reset
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={startStream}
                  disabled={isStreaming || Boolean(parsed.error)}
                >
                  {isStreaming ? 'Streaming…' : 'Replay stream'}
                </button>
              </div>
            </div>

            <textarea
              className="code-editor"
              aria-label={mode === 'syntax' ? 'vis syntax' : 'JSON configuration'}
              spellCheck={false}
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setStreamText(null);
              }}
            />

            <div className={parsed.error ? 'parse-status error' : 'parse-status'}>
              {parsed.error || `${source.length.toLocaleString()} characters · ${mode === 'syntax' ? 'vis grammar' : 'JSON configuration'}`}
            </div>
          </section>

          <section className="preview-column" aria-label="Chart preview">
            <div className="preview-frame">
              {parsed.error && !isStreaming ? (
                <div className="editor-error" role="alert">
                  <strong>Cannot render input</strong>
                  <p>{parsed.error}</p>
                  <p>Fix the JSON or switch back to vis syntax.</p>
                </div>
              ) : (
                <GPTVisChart
                  content={chartContent}
                  theme={theme}
                  streaming={isStreaming}
                  wrapper={wrapper}
                  locale={locale}
                  onStatus={setStatus}
                />
              )}
            </div>

            <div className="status-strip" aria-live="polite">
              <span className={`status-dot ${status.state}`} aria-hidden="true" />
              <strong>{STATUS_LABEL[status.state]}</strong>
              <span>{status.message || (status.state === 'ready' ? 'Chart rendered successfully.' : '')}</span>
              {isStreaming && <span className="stream-badge">live stream</span>}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
