import Editor from '@monaco-editor/react';
import { useSimulationStore } from '../../store/simulationStore';
import { useUIStore } from '../../store/uiStore';
import { Play, RotateCcw, AlertCircle } from 'lucide-react';
import './CodeEditor.css';

export function CodeEditor() {
  const code = useSimulationStore(s => s.code);
  const setCode = useSimulationStore(s => s.setCode);
  const run = useSimulationStore(s => s.run);
  const reset = useSimulationStore(s => s.reset);
  const hasRun = useSimulationStore(s => s.hasRun);
  const error = useSimulationStore(s => s.error);
  const theme = useUIStore(s => s.theme);

  const currentStep = useSimulationStore(s => {
    if (!s.hasRun || s.steps.length === 0) return null;
    return s.steps[s.currentStepIndex] ?? null;
  });

  const currentLine = currentStep?.snapshot?.currentLine ?? null;

  return (
    <div className="code-editor-container">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button
            className={`btn btn-run ${!hasRun ? 'btn-run-pulse' : ''} tooltip`}
            data-tooltip="Run code (Ctrl+Enter)"
            onClick={run}
          >
            <Play size={13} strokeWidth={2.5} />
            Run
          </button>
          <button className="btn btn-ghost" onClick={reset} disabled={!hasRun}>
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
        <div className="toolbar-right">
          {hasRun && (
            <div className="editor-readonly-badge">
              <span className="readonly-dot" />
              Read-only
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="editor-error">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={(val) => setCode(val ?? '')}
          theme={theme === 'dark' ? 'visualizer-dark' : 'visualizer-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            renderLineHighlight: 'none',
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              verticalScrollbarSize: 5,
              horizontalScrollbarSize: 5,
              verticalSliderSize: 5,
            },
            readOnly: hasRun,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
          }}
          onMount={(editor, monaco) => {
            // Dark theme
            monaco.editor.defineTheme('visualizer-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '4a4e6a', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' },
                { token: 'string', foreground: '86efac' },
                { token: 'number', foreground: 'fbbf24' },
              ],
              colors: {
                'editor.background': '#070a12',
                'editor.foreground': '#e8eaf6',
                'editor.lineHighlightBackground': '#0e1020',
                'editor.lineHighlightBorder': '#00000000',
                'editorLineNumber.foreground': '#2a2d44',
                'editorLineNumber.activeForeground': '#818cf8',
                'editor.selectionBackground': '#818cf830',
                'editor.inactiveSelectionBackground': '#818cf815',
                'editorCursor.foreground': '#818cf8',
                'editorWidget.background': '#0c1020',
                'editorWidget.border': '#1a1d38',
                'editorSuggestWidget.background': '#0c1020',
                'editorSuggestWidget.border': '#1a1d38',
                'editorSuggestWidget.selectedBackground': '#1e2244',
              },
            });

            // Light theme
            monaco.editor.defineTheme('visualizer-light', {
              base: 'vs',
              inherit: true,
              rules: [
                { token: 'comment', foreground: '9098c0', fontStyle: 'italic' },
                { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
                { token: 'string', foreground: '059669' },
                { token: 'number', foreground: 'd97706' },
              ],
              colors: {
                'editor.background': '#f8f9ff',
                'editor.foreground': '#1a1d2e',
                'editor.lineHighlightBackground': '#edf0ff',
                'editor.lineHighlightBorder': '#00000000',
                'editorLineNumber.foreground': '#c5cbdf',
                'editorLineNumber.activeForeground': '#5b63e8',
                'editor.selectionBackground': '#5b63e830',
                'editor.inactiveSelectionBackground': '#5b63e815',
                'editorCursor.foreground': '#5b63e8',
                'editorWidget.background': '#f8f9ff',
                'editorWidget.border': '#dde0f5',
              },
            });

            monaco.editor.setTheme(theme === 'dark' ? 'visualizer-dark' : 'visualizer-light');

            // Subscribe to theme changes
            useUIStore.subscribe((state) => {
              monaco.editor.setTheme(state.theme === 'dark' ? 'visualizer-dark' : 'visualizer-light');
            });

            let decorations: string[] = [];
            const updateHighlight = (line: number | null) => {
              if (line && line > 0) {
                decorations = editor.deltaDecorations(decorations, [
                  {
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                      isWholeLine: true,
                      className: 'highlighted-line',
                      linesDecorationsClassName: 'highlighted-line-deco',
                    },
                  },
                ]);
              } else {
                decorations = editor.deltaDecorations(decorations, []);
              }
            };

            useSimulationStore.subscribe((state) => {
              if (!state.hasRun || state.steps.length === 0) {
                updateHighlight(null);
                return;
              }
              const step = state.steps[state.currentStepIndex];
              updateHighlight(step?.snapshot?.currentLine ?? null);
            });

            if (currentLine) updateHighlight(currentLine);
          }}
        />
      </div>
    </div>
  );
}
