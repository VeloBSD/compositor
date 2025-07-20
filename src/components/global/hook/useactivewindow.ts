import { useWindowStore, useActiveWindow as useActiveWindowSelector, useAllWindows, WindowInfo, WindowState } from '../../../stores/windowStore';

export type { WindowState } from '../../../stores/windowStore';
export type { WindowInfo as ActiveWindowInfo } from '../../../stores/windowStore';

interface UseActiveWindowReturn {
  activeWindow: WindowInfo | null;
  allWindows: WindowInfo[];
  setActiveWindow: (windowInfo: WindowInfo) => void;
  clearActiveWindow: () => void;
  registerWindow: (id: string, title: string) => void;
  unregisterWindow: (id: string) => void;
  activateWindow: (id: string) => void;
  updateWindowTitle: (id: string, title: string) => void;
  updateWindowState: (id: string, state: WindowState) => void;
  closeWindow: (id: string) => void;
}

export function useActiveWindow(): UseActiveWindowReturn {
  const {
    activateWindow,
    clearActiveWindow,
    registerWindow,
    unregisterWindow,
    updateWindowTitle,
    updateWindowState,
    closeWindow
  } = useWindowStore();
  
  // Use the stable selectors instead of function calls
  const activeWindow = useActiveWindowSelector();
  const allWindows = useAllWindows();

  const setActiveWindow = (windowInfo: WindowInfo) => {
    activateWindow(windowInfo.id);
  };

  return {
    activeWindow,
    allWindows,
    setActiveWindow,
    clearActiveWindow,
    registerWindow,
    unregisterWindow,
    activateWindow,
    updateWindowTitle,
    updateWindowState,
    closeWindow
  };
}