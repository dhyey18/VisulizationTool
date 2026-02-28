import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import { useSimulationStore } from '../../store/simulationStore';
import { getShareUrl } from '../../utils/codeSharing';
import { X, Copy, Check } from 'lucide-react';

export function ShareModal() {
  const isOpen = useUIStore(s => s.isShareModalOpen);
  const close = useUIStore(s => s.closeShareModal);
  const code = useSimulationStore(s => s.code);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = getShareUrl(code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            className="modal-content share-modal"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Share Code</h2>
              <button className="modal-close-btn" onClick={close} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <p className="share-text">
              Share this URL to let others view and replay your code in the visualizer:
            </p>

            <div className="share-url-row">
              <input
                className="share-url-input"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
