import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useSimulationStore } from '../../store/simulationStore';
import { getExamplesByCategory, getCategoryLabel } from '../../utils/codeExamples';
import type { CodeExample } from '../../types/simulation';
import { X, Search } from 'lucide-react';
import './ExamplesModal.css';

export function ExamplesModal() {
  const isOpen = useUIStore(s => s.isExamplesModalOpen);
  const close = useUIStore(s => s.closeExamplesModal);
  const setCode = useSimulationStore(s => s.setCode);
  const reset = useSimulationStore(s => s.reset);

  const [query, setQuery] = useState('');

  const categories = getExamplesByCategory();

  const filteredCategories: Record<string, CodeExample[]> = {};
  const q = query.toLowerCase().trim();
  for (const [cat, exs] of Object.entries(categories)) {
    const filtered = q
      ? exs.filter(
        ex =>
          ex.title.toLowerCase().includes(q) ||
          ex.description.toLowerCase().includes(q)
      )
      : exs;
    if (filtered.length > 0) filteredCategories[cat] = filtered;
  }

  if (!isOpen) return null;

  const handleSelect = (ex: CodeExample) => {
    reset();
    setCode(ex.code);
    close();
    setQuery('');
  };

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
            {/* Header */}
            <div className="modal-header">
              <div>
                <h2>Code Examples</h2>
                <p className="modal-subtitle">
                  {Object.values(categories).flat().length} examples across{' '}
                  {Object.keys(categories).length} categories
                </p>
              </div>
              <button className="modal-close-btn" onClick={close} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="examples-search">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                type="text"
                placeholder="Search examples..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Examples Grid */}
            <div className="examples-grid">
              {Object.keys(filteredCategories).length === 0 ? (
                <div className="examples-empty">
                  <span>No examples match &ldquo;{query}&rdquo;</span>
                </div>
              ) : (
                Object.entries(filteredCategories).map(([cat, exs]) => (
                  <div key={cat} className="category-section">
                    <h3 className="category-title">{getCategoryLabel(cat)}</h3>
                    <div className="category-examples">
                      {exs.map((ex) => (
                        <button
                          key={ex.id}
                          className="example-card"
                          onClick={() => handleSelect(ex)}
                        >
                          <div className="example-title">{ex.title}</div>
                          <div className="example-desc">{ex.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
