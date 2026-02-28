import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useSimulationStore } from '../../store/simulationStore';
import { getExamplesByCategory, getCategoryLabel } from '../../utils/codeExamples';
import { X } from 'lucide-react';

export function ExamplesModal() {
  const isOpen = useUIStore(s => s.isExamplesModalOpen);
  const close = useUIStore(s => s.closeExamplesModal);
  const setCode = useSimulationStore(s => s.setCode);

  const categories = getExamplesByCategory();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="modal-content examples-modal"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Code Examples</h2>
              <button className="modal-close-btn" onClick={close} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="examples-grid">
              {Object.entries(categories).map(([cat, examples]) => (
                <div key={cat} className="category-section">
                  <h3 className="category-title">{getCategoryLabel(cat)}</h3>
                  <div className="category-examples">
                    {examples.map((ex) => (
                      <button
                        key={ex.id}
                        className="example-card"
                        onClick={() => {
                          setCode(ex.code);
                          close();
                        }}
                      >
                        <div className="example-title">{ex.title}</div>
                        <div className="example-desc">{ex.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
