import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Cpu, Sun, Moon, BookOpen, Share2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import './MainLayout.css';

interface Props {
  editor: ReactNode;
  visualization: ReactNode;
  controls: ReactNode;
}

export function MainLayout({ editor, visualization, controls }: Props) {
  const theme = useUIStore(s => s.theme);
  const toggleTheme = useUIStore(s => s.toggleTheme);
  const openExamples = useUIStore(s => s.openExamplesModal);
  const openShare = useUIStore(s => s.openShareModal);

  // Sync theme to DOM on initial load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">
              <Cpu size={14} strokeWidth={2.5} />
            </div>
            <div className="logo-text-group">
              <span className="logo-text">JS Visualizer</span>
              <span className="logo-tagline">Runtime Execution Explorer</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <div className="header-kbd-hint">
            <kbd>Space</kbd>
            <span>Play</span>
            <span className="kbd-sep">·</span>
            <kbd>←</kbd>
            <kbd>→</kbd>
            <span>Step</span>
            <span className="kbd-sep">·</span>
            <kbd>R</kbd>
            <span>Run</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn btn-ghost btn-icon header-action-btn tooltip"
            data-tooltip="Examples"
            onClick={openExamples}
            aria-label="Open examples"
          >
            <BookOpen size={15} />
          </button>
          <button
            className="btn btn-ghost btn-icon header-action-btn tooltip"
            data-tooltip="Share"
            onClick={openShare}
            aria-label="Share code"
          >
            <Share2 size={15} />
          </button>
          <div className="header-sep" />
          <button
            className="btn btn-ghost btn-icon header-action-btn theme-toggle tooltip"
            data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <div className="layout-grid">
        <div className="panel-editor">{editor}</div>
        <div className="panel-divider" />
        <div className="panel-viz">{visualization}</div>
      </div>
      <div className="panel-controls">{controls}</div>
    </div>
  );
}
