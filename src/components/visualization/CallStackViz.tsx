import { motion, AnimatePresence } from 'framer-motion';
import type { StackFrame } from '../../types/simulation';
import { Layers } from 'lucide-react';
import './visualizations.css';

interface Props {
  frames: StackFrame[];
  highlightId?: string;
}

export function CallStackViz({ frames, highlightId }: Props) {
  return (
    <div className="viz-section">
      <div className="section-header">
        <span className="dot" style={{ background: 'var(--accent-callstack)' }} />
        Call Stack
        <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-callstack)' }}>
          {frames.length}
        </span>
      </div>
      <div className="section-body callstack-body">
        <AnimatePresence mode="popLayout">
          {frames.length === 0 ? (
            <motion.div
              key="empty"
              className="viz-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Layers size={20} />
              <span>Empty</span>
            </motion.div>
          ) : (
            [...frames].reverse().map((frame, i) => (
              <motion.div
                key={frame.id}
                className={`stack-frame ${frame.id === highlightId ? 'stack-frame-active' : ''} ${i === 0 ? 'stack-frame-top' : ''}`}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="frame-header">
                  <span className="frame-name">{frame.name}()</span>
                  {frame.line > 0 && <span className="frame-line">line {frame.line}</span>}
                </div>
                {Object.keys(frame.variables).length > 0 && (
                  <div className="frame-vars">
                    {Object.entries(frame.variables).slice(0, 6).map(([k, v]) => (
                      <div key={k} className="frame-var">
                        <span className="var-name">{k}</span>
                        <span className="var-value">{formatVal(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatVal(v: { type: string; value?: unknown; name?: string; label?: string }): string {
  if (v.type === 'string') return `"${v.value}"`;
  if (v.type === 'undefined') return 'undefined';
  if (v.type === 'null') return 'null';
  if (v.type === 'function') return `fn ${v.name ?? ''}`;
  if (v.type === 'reference') return v.label ?? '[ref]';
  return String(v.value);
}
