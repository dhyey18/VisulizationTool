import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { CodeEditor } from './components/editor/CodeEditor';
import { VisualizationContainer } from './components/visualization/VisualizationContainer';
import { ControlPanel } from './components/controls/ControlPanel';
import { ExamplesModal } from './components/modals/ExamplesModal';
import { ShareModal } from './components/modals/ShareModal';
import { useAutoPlay } from './hooks/useAutoPlay';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSimulationStore } from './store/simulationStore';
import { useUIStore } from './store/uiStore';
import { getCodeFromUrl } from './utils/codeSharing';
import './components/modals/modals.css';

function App() {
  useAutoPlay();
  useKeyboardShortcuts();

  const setCode = useSimulationStore(s => s.setCode);
  const theme = useUIStore(s => s.theme);

  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load code from URL on mount
  useEffect(() => {
    const urlCode = getCodeFromUrl();
    if (urlCode) {
      setCode(urlCode);
    }
  }, [setCode]);

  return (
    <>
      <MainLayout
        editor={<CodeEditor />}
        visualization={<VisualizationContainer />}
        controls={<ControlPanel />}
      />
      <ExamplesModal />
      <ShareModal />
    </>
  );
}

export default App;
