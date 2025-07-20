import React, { ReactNode, useState, useRef, useEffect, useId, useCallback } from 'react';
import { Minus, Square, X, Maximize2, Pin, PinOff, Copy, Info } from 'lucide-react';
import { useActiveWindow } from '../global/hook/useactivewindow';

interface WindowedContainerProps {
  title?: string;
  children?: ReactNode;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  zIndex?: number;
}

type WindowState = 'normal' | 'maximized' | 'minimized';
type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// Constants for UI spacing
const TOPBAR_HEIGHT = 32; // 8 * 4 = 32px (h-8 in Tailwind)
const DOCK_HEIGHT = 80; // Approximate dock height with padding
const DOCK_MARGIN = 16; // bottom-4 = 16px margin

// Context Menu Hook for Window
function useWindowContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const showContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}

// Window Context Menu Component
function WindowContextMenu({
  visible,
  x,
  y,
  onClose,
  windowState,
  onMinimize,
  onMaximize,
  onCloseWindow,
  title,
  isAlwaysOnTop,
  onToggleAlwaysOnTop
}: {
  visible: boolean;
  x: number;
  y: number;
  onClose: () => void;
  windowState: WindowState;
  onMinimize: () => void;
  onMaximize: () => void;
  onCloseWindow: () => void;
  title: string;
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const menuItems = [
    {
      id: 'minimize',
      label: 'Minimize',
      icon: Minus,
      action: () => {
        onMinimize();
        onClose();
      },
      disabled: windowState === 'minimized'
    },
    {
      id: 'maximize',
      label: windowState === 'maximized' ? 'Restore' : 'Maximize',
      icon: windowState === 'maximized' ? Square : Maximize2,
      action: () => {
        onMaximize();
        onClose();
      }
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'alwaysOnTop',
      label: isAlwaysOnTop ? 'Unpin from Top' : 'Pin to Top',
      icon: isAlwaysOnTop ? PinOff : Pin,
      action: () => {
        onToggleAlwaysOnTop();
        onClose();
      }
    },
    {
      id: 'copyTitle',
      label: 'Copy Title',
      icon: Copy,
      action: () => {
        navigator.clipboard.writeText(title);
        onClose();
      }
    },
    {
      id: 'separator2',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'about',
      label: 'Window Info',
      icon: Info,
      action: () => {
        alert(`Window: ${title}\nState: ${windowState}\nAlways on Top: ${isAlwaysOnTop}`);
        onClose();
      }
    },
    {
      id: 'separator3',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'close',
      label: 'Close',
      icon: X,
      action: () => {
        onCloseWindow();
        onClose();
      },
      danger: true
    }
  ];

  const enabledItems = menuItems.filter(item => !item.separator);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev + 1;
          while (next < enabledItems.length && enabledItems[next].disabled) {
            next++;
          }
          return next >= enabledItems.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && enabledItems[next].disabled) {
            next--;
          }
          return next < 0 ? enabledItems.length - 1 : next;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!enabledItems[focusedIndex].disabled) {
          enabledItems[focusedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      menuRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed bg-zinc-800/95 backdrop-blur-md border border-zinc-600/50 rounded-lg shadow-xl z-[9999] py-1 min-w-[180px]"
      style={{
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - 300),
      }}
    >
      {menuItems.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={item.id}
              className="h-px bg-zinc-600/50 mx-2 my-1"
              role="separator"
            />
          );
        }

        const IconComponent = item.icon;
        const enabledIndex = enabledItems.findIndex(enabled => enabled.id === item.id);
        const isFocused = focusedIndex === enabledIndex;
        
        return (
          <button
            key={item.id}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.action();
              }
            }}
            onMouseEnter={() => {
              if (!item.disabled) {
                setFocusedIndex(enabledIndex);
              }
            }}
            className={`w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-700/50 transition-all duration-200 flex items-center space-x-3 focus:outline-none focus:bg-zinc-700/50 text-xs ${
              isFocused ? 'bg-zinc-700/50' : ''
            } ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              item.danger ? 'hover:bg-red-600/20 hover:text-red-400' : ''
            }`}
          >
            {IconComponent && <IconComponent size={14} aria-hidden="true" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const WindowedContainer: React.FC<WindowedContainerProps> = ({
  title = 'Terminal',
  children,
  onMinimize,
  onMaximize,
  onClose,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 },
  minSize = { width: 300, height: 200 },
  zIndex = 10,
}) => {
  // Generate a unique ID for this window instance
  const windowId = useId();
  
  // Window state management
  const [windowState, setWindowState] = useState<WindowState>('normal');
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [previousState, setPreviousState] = useState({ position: initialPosition, size: initialSize });
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  
  // Dragging and resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Use the active window hook
  const { registerWindow, unregisterWindow, activateWindow, updateWindowTitle, updateWindowState, activeWindow } = useActiveWindow();
  
  // Context menu functionality
  const { contextMenu, showContextMenu, hideContextMenu } = useWindowContextMenu();
  
  // Toggle always on top
  const handleToggleAlwaysOnTop = () => {
    setIsAlwaysOnTop(!isAlwaysOnTop);
  };
  
  // Register this window when mounted
  useEffect(() => {
    registerWindow(windowId, title);
    
    return () => {
      unregisterWindow(windowId);
    };
  }, []);
  
  // Update title when it changes
  useEffect(() => {
    updateWindowTitle(windowId, title);
  }, [title]);
  
  // Update window state in the hook when local state changes
  useEffect(() => {
    updateWindowState(windowId, windowState);
  }, [windowState]);
  
  // Ref for the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Activate this window when clicked
  const handleWindowClick = () => {
    activateWindow(windowId);
  };
  
  // Minimize window
  const handleMinimize = () => {
    if (windowState !== 'minimized') {
      setPreviousState({ position, size });
      setWindowState('minimized');
    }
    onMinimize?.();
  };
  
  // Maximize/restore window with proper spacing for topbar and dock
  const handleMaximize = () => {
    if (windowState === 'maximized') {
      // Restore to previous state
      setPosition(previousState.position);
      setSize(previousState.size);
      setWindowState('normal');
    } else {
      // Save current state and maximize
      setPreviousState({ position, size });
      
      // Calculate available space accounting for topbar and dock
      const availableWidth = window.innerWidth;
      const availableHeight = window.innerHeight - TOPBAR_HEIGHT - DOCK_HEIGHT - DOCK_MARGIN;
      
      setPosition({ x: 0, y: TOPBAR_HEIGHT });
      setSize({ 
        width: availableWidth, 
        height: availableHeight
      });
      setWindowState('maximized');
    }
    onMaximize?.();
  };
  
  // Start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the title bar, not from the window controls
    if ((e.target as HTMLElement).closest('.window-controls') || windowState === 'maximized') {
      return;
    }
    
    // Activate window when dragging starts
    activateWindow(windowId);
    setIsDragging(true);
    
    // Calculate the offset between mouse position and container position
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setDragOffset({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      });
    }
  };
  
  // Start resizing
  const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    if (windowState === 'maximized') return;
    
    activateWindow(windowId);
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };
  
  // Handle dragging with boundary constraints
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isResizing) {
      // Calculate new position with constraints
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Constrain to screen bounds
      newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
      newY = Math.max(TOPBAR_HEIGHT, Math.min(newY, window.innerHeight - DOCK_HEIGHT - DOCK_MARGIN - size.height));
      
      setPosition({ x: newX, y: newY });
    } else if (isResizing && resizeDirection) {
      // Calculate new size based on resize direction
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;
      
      // Handle horizontal resizing
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(minSize.width, Math.min(resizeStart.width + deltaX, window.innerWidth - position.x));
      } else if (resizeDirection.includes('w')) {
        const maxWidth = resizeStart.width + position.x;
        newWidth = Math.max(minSize.width, Math.min(resizeStart.width - deltaX, maxWidth));
        newX = Math.max(0, position.x + (resizeStart.width - newWidth));
      }
      
      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        const maxHeight = window.innerHeight - DOCK_HEIGHT - DOCK_MARGIN - position.y;
        newHeight = Math.max(minSize.height, Math.min(resizeStart.height + deltaY, maxHeight));
      } else if (resizeDirection.includes('n')) {
        const maxHeight = resizeStart.height + (position.y - TOPBAR_HEIGHT);
        newHeight = Math.max(minSize.height, Math.min(resizeStart.height - deltaY, maxHeight));
        newY = Math.max(TOPBAR_HEIGHT, position.y + (resizeStart.height - newHeight));
      }
      
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, isResizing, resizeDirection, dragOffset, resizeStart, position, size, minSize]);
  
  // End dragging/resizing
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  }, []);
  
  // Add and remove event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);
  
  // Determine if this window is active
  const isActive = activeWindow?.id === windowId;
  
  // Don't render if minimized
  if (windowState === 'minimized') {
    return null;
  }
  
  // Get cursor style for resize handles
  const getResizeCursor = (direction: ResizeDirection) => {
    const cursors = {
      n: 'cursor-ns-resize',
      s: 'cursor-ns-resize',
      e: 'cursor-ew-resize',
      w: 'cursor-ew-resize',
      ne: 'cursor-nesw-resize',
      nw: 'cursor-nwse-resize',
      se: 'cursor-nwse-resize',
      sw: 'cursor-nesw-resize'
    };
    return cursors[direction];
  };
  
  return (
    <div 
      ref={containerRef}
      className={`bg-zinc-900 border ${
        isActive ? 'border-zinc-600' : 'border-zinc-800'
      } shadow-xl absolute select-none ${
        windowState === 'maximized' ? 'rounded-none' : 'rounded-lg'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isAlwaysOnTop ? zIndex + 100 : (isActive ? zIndex + 10 : zIndex),
        boxShadow: isActive 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: (isDragging || isResizing) ? 'none' : 'all 0.2s ease-in-out'
      }}
      onClick={handleWindowClick}
    >
      {/* Resize Handles - only show when not maximized */}
      {windowState === 'normal' && (
        <>
          {/* Corner handles */}
          <div 
            className={`absolute top-0 left-0 w-2 h-2 ${getResizeCursor('nw')}`}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
          <div 
            className={`absolute top-0 right-0 w-2 h-2 ${getResizeCursor('ne')}`}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          <div 
            className={`absolute bottom-0 left-0 w-2 h-2 ${getResizeCursor('sw')}`}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          <div 
            className={`absolute bottom-0 right-0 w-2 h-2 ${getResizeCursor('se')}`}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          
          {/* Edge handles */}
          <div 
            className={`absolute top-0 left-2 right-2 h-1 ${getResizeCursor('n')}`}
            onMouseDown={(e) => handleResizeStart(e, 'n')}
          />
          <div 
            className={`absolute bottom-0 left-2 right-2 h-1 ${getResizeCursor('s')}`}
            onMouseDown={(e) => handleResizeStart(e, 's')}
          />
          <div 
            className={`absolute left-0 top-2 bottom-2 w-1 ${getResizeCursor('w')}`}
            onMouseDown={(e) => handleResizeStart(e, 'w')}
          />
          <div 
            className={`absolute right-0 top-2 bottom-2 w-1 ${getResizeCursor('e')}`}
            onMouseDown={(e) => handleResizeStart(e, 'e')}
          />
        </>
      )}
      
      {/* Title Bar */}
      <div 
        className={`${
          isActive ? 'bg-zinc-700' : 'bg-zinc-800'
        } px-3 py-2 border-b border-zinc-700 ${
          windowState === 'maximized' ? 'cursor-default rounded-none' : 'cursor-move rounded-t-lg'
        }`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleMaximize}
        onContextMenu={showContextMenu}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold text-zinc-300 truncate">{title}</div>
          <div className="flex items-center space-x-1 window-controls">
            {/* Minimize Button */}
            <button
              className="p-1.5 rounded hover:bg-zinc-600 transition-colors cursor-pointer"
              onClick={handleMinimize}
              title="Minimize"
            >
              <Minus className="h-3 w-3 text-zinc-400" />
            </button>
            
            {/* Maximize/Restore Button */}
            <button
              className="p-1.5 rounded hover:bg-zinc-600 transition-colors cursor-pointer"
              onClick={handleMaximize}
              title={windowState === 'maximized' ? 'Restore' : 'Maximize'}
            >
              {windowState === 'maximized' ? (
                <Square className="h-3 w-3 text-zinc-400" />
              ) : (
                <Maximize2 className="h-3 w-3 text-zinc-400" />
              )}
            </button>
            
            {/* Close Button */}
            <button
              className="p-1.5 rounded hover:bg-red-600 transition-colors cursor-pointer"
              onClick={onClose}
              title="Close"
            >
              <X className="h-3 w-3 text-zinc-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto" style={{ height: `${size.height - 40}px` }}>
        <div className="p-4 text-zinc-300 text-sm h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WindowedContainer;