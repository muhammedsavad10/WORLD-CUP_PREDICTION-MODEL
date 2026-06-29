import { create } from 'zustand';

interface UIState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  selectedMatchId: number | null;
  setSelectedMatchId: (id: number | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  lastWsEvent: string | null;
  setLastWsEvent: (event: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme });
  },
  selectedMatchId: null,
  setSelectedMatchId: (selectedMatchId) => set({ selectedMatchId }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  lastWsEvent: null,
  setLastWsEvent: (lastWsEvent) => set({ lastWsEvent }),
}));
