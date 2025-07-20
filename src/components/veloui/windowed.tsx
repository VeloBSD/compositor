import React, { ReactNode, useState, useRef, useEffect, useId, useCallback } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
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
  
  // Dragging and resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Use the active window hook
  const { registerWindow, unregisterWindow, activateWindow, updateWindowTitle, updateWindowState, activeWindow } = useActiveWindow();
  
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
        zIndex: isActive ? zIndex + 10 : zIndex,
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