import { motion } from 'framer-motion';
import type { EventLoopPhase } from '../../types/simulation';
import { RefreshCw } from 'lucide-react';

interface Props {
  phase: EventLoopPhase;
}

const phaseLabels: Record<EventLoopPhase, string> = {
  idle: 'Idle',
  callStack: 'Executing Call Stack',
  microtasks: 'Processing Microtasks',
  macrotask: 'Processing Macrotask',
  checking: 'Checking Queues',
};

const phaseColors: Record<EventLoopPhase, string> = {
  idle: 'var(--text-muted)',
  callStack: 'var(--accent-callstack)',
  microtasks: 'var(--accent-microtask)',
  macrotask: 'var(--accent-taskqueue)',
  checking: 'var(--accent-eventloop)',
};

export function EventLoopViz({ phase }: Props) {
  const isActive = phase !== 'idle';

  return (
    <div className="viz-section event-loop-section">
      <div className="section-header">
        <span className="dot" style={{ background: 'var(--accent-eventloop)' }} />
        Event Loop
      </div>
      <div className="section-body event-loop-body">
        <div className="event-loop-visual">
          <motion.div
            className="event-loop-ring"
            style={{ borderColor: phaseColors[phase] }}
            animate={{
              rotate: isActive ? 360 : 0,
              boxShadow: isActive
                ? `0 0 16px ${phaseColors[phase]}40`
                : '0 0 0px transparent',
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              boxShadow: { duration: 0.3 },
            }}
          >
            <motion.div
              animate={{ scale: isActive ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
            >
              <RefreshCw
                size={20}
                style={{ color: phaseColors[phase] }}
              />
            </motion.div>
          </motion.div>

          <div className="event-loop-info">
            <motion.div
              className="event-loop-phase"
              style={{ color: phaseColors[phase] }}
              key={phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {phaseLabels[phase]}
            </motion.div>

            <div className="event-loop-flow">
              {(['callStack', 'microtasks', 'macrotask'] as EventLoopPhase[]).map((p, i) => (
                <span key={p} className="event-loop-flow-item">
                  {i > 0 && <span className="flow-arrow">→</span>}
                  <span
                    className={`flow-label ${phase === p ? 'flow-label-active' : ''}`}
                    style={phase === p ? { color: phaseColors[p] } : undefined}
                  >
                    {p === 'callStack' ? 'Stack' : p === 'microtasks' ? 'Micro' : 'Macro'}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
