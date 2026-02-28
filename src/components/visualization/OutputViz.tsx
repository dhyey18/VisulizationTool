import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface Props {
  output: string[];
}

export function OutputViz({ output }: Props) {
  return (
    <div className="viz-section output-section">
      <div className="section-header">
        <span className="dot" style={{ background: 'var(--accent-output)' }} />
        Console Output
        <span className="badge" style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--accent-output)' }}>
          {output.length}
        </span>
      </div>
      <div className="section-body output-body">
        <AnimatePresence mode="popLayout">
          {output.length === 0 ? (
            <motion.div key="empty" className="viz-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Terminal size={18} />
              <span>No output yet</span>
            </motion.div>
          ) : (
            output.map((line, i) => (
              <motion.div
                key={`${i}-${line}`}
                className="output-line"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <span className="output-prefix">&gt;</span>
                <span className="output-text">{line}</span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
