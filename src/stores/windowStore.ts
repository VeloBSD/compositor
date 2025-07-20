import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

export type WindowState = 'normal' | 'maximized' | 'minimized';

export interface WindowInfo {
  id: string;
  title: string;
  isActive: boolean;
  state: WindowState;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  isAlwaysOnTop?: boolean;
  lastActiveTime?: number;
}

interface WindowStore {
  // State
  windows: Record<string, WindowInfo>;
  activeWindowId: string | null;
  
  // Cached arrays to prevent infinite loops
  _allWindowsCache: WindowInfo[] | null;
  _visibleWindowsCache: WindowInfo[] | null;
  _minimizedWindowsCache: WindowInfo[] | null;
  _cacheVersion: number;
  
  // Actions
  registerWindow: (id: string, title: string, options?: Partial<WindowInfo>) => void;
  unregisterWindow: (id: string) => void;
  activateWindow: (id: string) => void;
  deactivateWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowInfo>) => void;
  updateWindowTitle: (id: string, title: string) => void;
  updateWindowState: (id: string, state: WindowState) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  setWindowAlwaysOnTop: (id: string, alwaysOnTop: boolean) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  
  // Getters
  getWindow: (id: string) => WindowInfo | undefined;
  getActiveWindow: () => WindowInfo | null;
  getAllWindows: () => WindowInfo[];
  getVisibleWindows: () => WindowInfo[];
  getMinimizedWindows: () => WindowInfo[];
  
  // Utilities
  clearActiveWindow: () => void;
  bringToFront: (id: string) => void;
  getNextZIndex: () => number;
  _invalidateCache: () => void;
}

export const useWindowStore = create<WindowStore>()(subscribeWithSelector(
  persist(
    (set, get) => ({
      // Initial state
      windows: {},
      activeWindowId: null,
      _allWindowsCache: null,
      _visibleWindowsCache: null,
      _minimizedWindowsCache: null,
      _cacheVersion: 0,
      
      // Cache invalidation helper
      _invalidateCache: () => {
        set((state) => ({
          _allWindowsCache: null,
          _visibleWindowsCache: null,
          _minimizedWindowsCache: null,
          _cacheVersion: state._cacheVersion + 1
        }));
      },
      
      // Actions
      registerWindow: (id, title, options = {}) => {
        set((state) => {
          const windowInfo: WindowInfo = {
            id,
            title,
            isActive: false,
            state: 'normal',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            zIndex: get().getNextZIndex(),
            isAlwaysOnTop: false,
            lastActiveTime: Date.now(),
            ...options
          };
          
          return {
            windows: {
              ...state.windows,
              [id]: windowInfo
            },
            _allWindowsCache: null,
            _visibleWindowsCache: null,
            _minimizedWindowsCache: null,
            _cacheVersion: state._cacheVersion + 1
          };
        });
      },
      
      unregisterWindow: (id) => {
        set((state) => {
          const newWindows = { ...state.windows };
          delete newWindows[id];
          
          const newActiveWindowId = state.activeWindowId === id ? null : state.activeWindowId;
          
          return { 
            windows: newWindows,
            activeWindowId: newActiveWindowId,
            _allWindowsCache: null,
            _visibleWindowsCache: null,
            _minimizedWindowsCache: null,
            _cacheVersion: state._cacheVersion + 1
          };
        });
      },
      
      activateWindow: (id) => {
        set((state) => {
          const window = state.windows[id];
          
          if (!window) return state;
          
          const newWindows = { ...state.windows };
          
          // Deactivate all other windows
          Object.keys(newWindows).forEach((winId) => {
            if (winId !== id && newWindows[winId].isActive) {
              newWindows[winId] = { ...newWindows[winId], isActive: false };
            }
          });
          
          // Activate the target window and bring to front
          const updatedWindow = {
            ...window,
            isActive: true,
            lastActiveTime: Date.now(),
            zIndex: get().getNextZIndex()
          };
          
          if (updatedWindow.state === 'minimized') {
            updatedWindow.state = 'normal';
          }
          
          newWindows[id] = updatedWindow;
          
          return {
            windows: newWindows,
            activeWindowId: id,
            _allWindowsCache: null,
            _visibleWindowsCache: null,
            _minimizedWindowsCache: null,
            _cacheVersion: state._cacheVersion + 1
          };
        });
      },
      
      deactivateWindow: (id) => {
        set((state) => {
          const window = state.windows[id];
          
          if (!window) return state;
          
          const newWindows = {
            ...state.windows,
            [id]: { ...window, isActive: false }
          };
          
          const newActiveWindowId = state.activeWindowId === id ? null : state.activeWindowId;
          
          return {
            windows: newWindows,
            activeWindowId: newActiveWindowId,
            _allWindowsCache: null,
            _visibleWindowsCache: null,
            _minimizedWindowsCache: null,
            _cacheVersion: state._cacheVersion + 1
          };
        });
      },
      
      updateWindow: (id, updates) => {
        set((state) => {
          const window = state.windows[id];
          
          if (!window) return state;
          
          return {
            windows: {
              ...state.windows,
              [id]: { ...window, ...updates }
            },
            _allWindowsCache: null,
            _visibleWindowsCache: null,
            _minimizedWindowsCache: null,
            _cacheVersion: state._cacheVersion + 1
          };
        });
      },
      
      updateWindowTitle: (id, title) => {
        get().updateWindow(id, { title });
      },
      
      updateWindowState: (id, state) => {
        get().updateWindow(id, { state });
      },
      
      updateWindowPosition: (id, position) => {
        get().updateWindow(id, { position });
      },
      
      updateWindowSize: (id, size) => {
        get().updateWindow(id, { size });
      },
      
      setWindowAlwaysOnTop: (id, alwaysOnTop) => {
        get().updateWindow(id, { isAlwaysOnTop: alwaysOnTop });
      },
      
      closeWindow: (id) => {
        get().unregisterWindow(id);
      },
      
      minimizeWindow: (id) => {
        get().updateWindow(id, { state: 'minimized', isActive: false });
        set((state) => ({
          activeWindowId: state.activeWindowId === id ? null : state.activeWindowId
        }));
      },
      
      maximizeWindow: (id) => {
        get().updateWindow(id, { state: 'maximized' });
        get().activateWindow(id);
      },
      
      restoreWindow: (id) => {
        get().updateWindow(id, { state: 'normal' });
        get().activateWindow(id);
      },
      
      // Getters with caching
      getWindow: (id) => {
        return get().windows[id];
      },
      
      getActiveWindow: () => {
        const { activeWindowId, windows } = get();
        return activeWindowId ? windows[activeWindowId] || null : null;
      },
      
      getAllWindows: () => {
        const state = get();
        if (state._allWindowsCache === null) {
          const windows = Object.values(state.windows);
          // Don't set cache here to avoid triggering updates
          return windows;
        }
        return state._allWindowsCache;
      },
      
      getVisibleWindows: () => {
        const state = get();
        if (state._visibleWindowsCache === null) {
          const windows = Object.values(state.windows).filter(w => w.state !== 'minimized');
          // Don't set cache here to avoid triggering updates
          return windows;
        }
        return state._visibleWindowsCache;
      },
      
      getMinimizedWindows: () => {
        const state = get();
        if (state._minimizedWindowsCache === null) {
          const windows = Object.values(state.windows).filter(w => w.state === 'minimized');
          // Don't set cache here to avoid triggering updates
          return windows;
        }
        return state._minimizedWindowsCache;
      },
      
      // Utilities
      clearActiveWindow: () => {
        set({ activeWindowId: null });
      },
      
      bringToFront: (id) => {
        get().updateWindow(id, { zIndex: get().getNextZIndex() });
      },
      
      getNextZIndex: () => {
        const windows = Object.values(get().windows);
        const maxZ = Math.max(...windows.map(w => w.zIndex || 0), 0);
        return maxZ + 1;
      }
    }),
    {
      name: 'window-store',
      partialize: (state) => ({
        windows: Object.fromEntries(
          Object.entries(state.windows).map(([id, window]) => [
            id,
            {
              ...window,
              isActive: false,
              state: window.state === 'maximized' ? 'normal' : window.state
            }
          ])
        )
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        activeWindowId: null,
        _allWindowsCache: null,
        _visibleWindowsCache: null,
        _minimizedWindowsCache: null,
        _cacheVersion: 0
      })
    }
  )
));

// Stable selectors that use direct property access
export const useActiveWindow = () => useWindowStore((state) => {
  const { activeWindowId, windows } = state;
  return activeWindowId ? windows[activeWindowId] || null : null;
});

export const useAllWindows = () => useWindowStore((state) => Object.values(state.windows));

export const useVisibleWindows = () => useWindowStore((state) => 
  Object.values(state.windows).filter(w => w.state !== 'minimized')
);

export const useMinimizedWindows = () => useWindowStore((state) => 
  Object.values(state.windows).filter(w => w.state === 'minimized')
);

export const useWindow = (id: string) => useWindowStore((state) => state.windows[id]);