import { motion, AnimatePresence } from 'framer-motion';
import type { QueuedTask } from '../../types/simulation';
import { ListOrdered } from 'lucide-react';

interface Props {
  tasks: QueuedTask[];
  highlightId?: string;
}

export function TaskQueueViz({ tasks, highlightId }: Props) {
  return (
    <div className="viz-section">
      <div className="section-header">
        <span className="dot" style={{ background: 'var(--accent-taskqueue)' }} />
        Callback Queue
        <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-taskqueue)' }}>
          {tasks.length}
        </span>
      </div>
      <div className="section-body queue-horizontal">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div key="empty" className="viz-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ListOrdered size={18} />
              <span>Empty</span>
            </motion.div>
          ) : (
            tasks.map((task) => (
              <motion.div
                key={task.id}
                className={`queue-chip taskqueue-chip ${task.id === highlightId ? 'queue-chip-active' : ''}`}
                layout
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.7, x: 30 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                {task.label}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
