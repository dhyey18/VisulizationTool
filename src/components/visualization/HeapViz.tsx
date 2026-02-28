import { motion, AnimatePresence } from 'framer-motion';
import type { HeapObject } from '../../types/simulation';
import { HardDrive } from 'lucide-react';

interface Props {
  heap: Record<string, HeapObject>;
  highlightId?: string;
}

export function HeapViz({ heap, highlightId }: Props) {
  const entries = Object.values(heap).filter(o => o.type !== 'function' || o.label !== 'resolve');

  return (
    <div className="viz-section">
      <div className="section-header">
        <span className="dot" style={{ background: 'var(--accent-heap)' }} />
        Heap / Memory
        <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-heap)' }}>
          {entries.length}
        </span>
      </div>
      <div className="section-body">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <motion.div key="empty" className="viz-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HardDrive size={20} />
              <span>No objects</span>
            </motion.div>
          ) : (
            entries.map((obj) => (
              <motion.div
                key={obj.id}
                className={`heap-object ${obj.id === highlightId ? 'heap-active' : ''}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="heap-header">
                  <span className="heap-type-badge">{obj.type}</span>
                  <span className="heap-label">{obj.label}</span>
                </div>
                {obj.promiseState && (
                  <div className={`promise-state promise-${obj.promiseState}`}>
                    {obj.promiseState}
                  </div>
                )}
                {Object.keys(obj.properties).length > 0 && (
                  <div className="heap-props">
                    {Object.entries(obj.properties).slice(0, 5).map(([k, v]) => (
                      <div key={k} className="heap-prop">
                        <span className="var-name">{k}:</span>
                        <span className="var-value">{formatHeapVal(v)}</span>
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

function formatHeapVal(v: { type: string; value?: unknown; name?: string; label?: string }): string {
  if (v.type === 'string') return `"${v.value}"`;
  if (v.type === 'undefined') return 'undefined';
  if (v.type === 'null') return 'null';
  if (v.type === 'function') return `fn ${v.name ?? ''}`;
  if (v.type === 'reference') return v.label ?? '[ref]';
  return String(v.value);
}
