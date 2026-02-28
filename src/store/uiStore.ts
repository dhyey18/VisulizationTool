import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UIState {
  isExamplesModalOpen: boolean;
  isShareModalOpen: boolean;
  theme: Theme;
  openExamplesModal: () => void;
  closeExamplesModal: () => void;
  openShareModal: () => void;
  closeShareModal: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isExamplesModalOpen: false,
      isShareModalOpen: false,
      theme: 'dark',
      openExamplesModal: () => set({ isExamplesModalOpen: true }),
      closeExamplesModal: () => set({ isExamplesModalOpen: false }),
      openShareModal: () => set({ isShareModalOpen: true }),
      closeShareModal: () => set({ isShareModalOpen: false }),
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },
      setTheme: (theme: Theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
    }),
    {
      name: 'js-visualizer-ui',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
