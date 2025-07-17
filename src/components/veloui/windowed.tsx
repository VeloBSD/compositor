import React, { ReactNode, useState, useRef, useEffect, useId } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useActiveWindow } from '../global/hook/useactivewindow';

interface WindowedContainerProps {
  title?: string;
  children?: ReactNode;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  zIndex?: number;
}

const WindowedContainer: React.FC<WindowedContainerProps> = ({
  title = 'Terminal',
  children,
  onMinimize,
  onMaximize,
  onClose,
  initialPosition = { x: 0, y: 0 },
  zIndex = 10,
}) => {
  // Generate a unique ID for this window instance
  const windowId = useId();
  
  // State for position tracking
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Use the active window hook
  const { registerWindow, unregisterWindow, activateWindow, updateWindowTitle, activeWindow } = useActiveWindow();
  
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
  
  // Ref for the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Activate this window when clicked
  const handleWindowClick = () => {
    activateWindow(windowId);
  };
  
  // Start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the title bar, not from the window controls
    if ((e.target as HTMLElement).closest('.window-controls')) {
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
  
  // Handle dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate new position based on mouse position and drag offset
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };
  
  // End dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  // Determine if this window is active
  const isActive = activeWindow?.id === windowId;
  
  return (
    <div 
      ref={containerRef}
      className={`max-w-2xl w-full bg-zinc-900 rounded-lg border ${isActive ? 'border-zinc-600' : 'border-zinc-800'} shadow-xl absolute`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isActive ? zIndex + 10 : zIndex,
        boxShadow: isActive 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease-in-out'
      }}
      onClick={handleWindowClick}
    >
      {/* Title Bar */}
      <div 
        className={`${isActive ? 'bg-zinc-700' : 'bg-zinc-800'} px-2 py-2 rounded-t-lg border-b border-zinc-700 cursor-move`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold text-zinc-300">{title}</div>
          <div className="flex items-center space-x-3 window-controls">
            {/* Window Controls */}
            <div
              className="p-1 rounded-full hover:bg-zinc-600 cursor-pointer"
              onClick={onMinimize}
            >
              <Minus className="h-3 w-3 text-zinc-400" />
            </div>
            <div
              className="p-1 rounded-full hover:bg-zinc-600 cursor-pointer"
              onClick={onMaximize}
            >
              <Square className="h-3 w-3 text-zinc-400" />
            </div>
            <div
              className="p-1 rounded-full hover:bg-zinc-600 cursor-pointer"
              onClick={onClose}
            >
              <X className="h-4 w-4 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4 text-zinc-300 text-sm">
        {children}
      </div>
    </div>
  );
};

export default WindowedContainer;