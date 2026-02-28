import { motion, AnimatePresence } from 'framer-motion';
import type { WebAPITimer } from '../../types/simulation';
import { Globe } from 'lucide-react';

interface Props {
  timers: WebAPITimer[];
  highlightId?: string;
}

export function WebAPIViz({ timers, highlightId }: Props) {
  return (
    <div className="viz-section">
      <div className="section-header">
        <span className="dot" style={{ background: 'var(--accent-webapi)' }} />
        Web APIs
        <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-webapi)' }}>
          {timers.length}
        </span>
      </div>
      <div className="section-body">
        <AnimatePresence mode="popLayout">
          {timers.length === 0 ? (
            <motion.div key="empty" className="viz-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Globe size={20} />
              <span>No active APIs</span>
            </motion.div>
          ) : (
            timers.map((timer) => (
              <motion.div
                key={timer.id}
                className={`queue-item webapi-item ${timer.id === highlightId ? 'queue-item-active' : ''}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="queue-item-header">
                  <span className="webapi-type">{timer.type}</span>
                  <span className="queue-item-name">{timer.callbackName}</span>
                </div>
                <div className="webapi-delay">{timer.delay}ms</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
