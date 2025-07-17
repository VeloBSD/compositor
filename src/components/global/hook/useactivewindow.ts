import { useState, useEffect } from 'react';

export interface ActiveWindowInfo {
  id: string;
  title: string;
  isActive: boolean;
}

interface UseActiveWindowReturn {
  activeWindow: ActiveWindowInfo | null;
  setActiveWindow: (windowInfo: ActiveWindowInfo) => void;
  clearActiveWindow: () => void;
  registerWindow: (id: string, title: string) => void;
  unregisterWindow: (id: string) => void;
  activateWindow: (id: string) => void;
  updateWindowTitle: (id: string, title: string) => void;
}

// Create a singleton instance to share state across components
let activeWindowState: ActiveWindowInfo | null = null;
let windowRegistry: Map<string, ActiveWindowInfo> = new Map();
let listeners: Set<(window: ActiveWindowInfo | null) => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener(activeWindowState));
};

export function useActiveWindow(): UseActiveWindowReturn {
  const [activeWindow, setActiveWindowState] = useState<ActiveWindowInfo | null>(activeWindowState);

  useEffect(() => {
    // Subscribe to changes
    const listener = (window: ActiveWindowInfo | null) => {
      setActiveWindowState(window);
    };
    
    listeners.add(listener);
    
    // Initial state
    setActiveWindowState(activeWindowState);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setActiveWindow = (windowInfo: ActiveWindowInfo) => {
    // Update the active window
    activeWindowState = windowInfo;
    
    // Update registry
    if (windowRegistry.has(windowInfo.id)) {
      windowRegistry.set(windowInfo.id, {
        ...windowRegistry.get(windowInfo.id)!,
        isActive: true
      });
    }
    
    // Deactivate other windows
    windowRegistry.forEach((info, id) => {
      if (id !== windowInfo.id && info.isActive) {
        windowRegistry.set(id, { ...info, isActive: false });
      }
    });
    
    notifyListeners();
  };

  const clearActiveWindow = () => {
    activeWindowState = null;
    notifyListeners();
  };

  const registerWindow = (id: string, title: string) => {
    const windowInfo = {
      id,
      title,
      isActive: false
    };
    
    windowRegistry.set(id, windowInfo);
  };

  const unregisterWindow = (id: string) => {
    if (activeWindowState?.id === id) {
      clearActiveWindow();
    }
    
    windowRegistry.delete(id);
  };

  const activateWindow = (id: string) => {
    const windowInfo = windowRegistry.get(id);
    if (windowInfo) {
      setActiveWindow({ ...windowInfo, isActive: true });
    }
  };

  const updateWindowTitle = (id: string, title: string) => {
    const windowInfo = windowRegistry.get(id);
    if (windowInfo) {
      const updatedInfo = { ...windowInfo, title };
      windowRegistry.set(id, updatedInfo);
      
      // If this is the active window, update active window state
      if (activeWindowState?.id === id) {
        activeWindowState = updatedInfo;
        notifyListeners();
      }
    }
  };

  return {
    activeWindow,
    setActiveWindow,
    clearActiveWindow,
    registerWindow,
    unregisterWindow,
    activateWindow,
    updateWindowTitle
  };
}