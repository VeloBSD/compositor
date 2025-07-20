import React, { useEffect, useState } from 'react';
import { useTransition, animated } from '@react-spring/web';
import { X, Monitor, Maximize2, Minimize2, Search } from 'lucide-react';
import { useWindowStore, useAllWindows } from '../../../stores/windowStore';

interface WindowOverviewProps {
  onClose: () => void;
  onWindowSelect: (windowId: string) => void;
}

const WindowOverview: React.FC<WindowOverviewProps> = ({ onClose, onWindowSelect }) => {
  const {
    activateWindow,
    closeWindow,
    restoreWindow,
    minimizeWindow
  } = useWindowStore();
  
  // Use the stable selector hook instead of calling getAllWindows()
  const allWindows = useAllWindows();
  const [hoveredWindow, setHoveredWindow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter windows based on search query
  const filteredWindows = allWindows.filter(window =>
    window.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort windows by last active time (most recent first)
  const sortedWindows = filteredWindows.sort((a, b) => 
    (b.lastActiveTime || 0) - (a.lastActiveTime || 0)
  );

  // Animation for the overview
  const transitions = useTransition(true, {
    from: { opacity: 0, transform: 'scale(1.1)' },
    enter: { opacity: 1, transform: 'scale(1)' },
    leave: { opacity: 0, transform: 'scale(1.1)' },
    config: { tension: 300, friction: 30 }
  });

  // Handle window selection
  const handleWindowSelect = (windowId: string) => {
    activateWindow(windowId);
    onWindowSelect(windowId);
  };

  // Handle window close
  const handleWindowClose = (windowId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    closeWindow(windowId);
  };

  // Handle window toggle
  const handleWindowToggle = (windowId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const window = allWindows.find(w => w.id === windowId);
    if (window) {
      if (window.state === 'minimized') {
        restoreWindow(windowId);
      } else {
        minimizeWindow(windowId);
      }
    }
  };

  // Handle click outside to close
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Clear search on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, onClose]);

  return transitions((style, item) =>
    item ? (
      <animated.div
        style={style}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col"
        onClick={handleBackdropClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Activities Overview</h1>
            <p className="text-gray-400">
              {sortedWindows.length} window{sortedWindows.length !== 1 ? 's' : ''} open
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 mb-8">
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Type to search windows..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-white/10 border border-gray-600/50 rounded-2xl pl-12 pr-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Windows Grid */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto">
          {sortedWindows.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {sortedWindows.map((window) => (
                <div
                  key={window.id}
                  className={`group relative bg-gray-800/40 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-gray-700/50 ${
                    window.isActive ? 'ring-2 ring-blue-500/50' : ''
                  } ${
                    window.state === 'minimized' ? 'opacity-60' : ''
                  }`}
                  onClick={() => handleWindowSelect(window.id)}
                  onMouseEnter={() => setHoveredWindow(window.id)}
                  onMouseLeave={() => setHoveredWindow(null)}
                >
                  {/* Window Preview */}
                  <div className="aspect-video bg-gray-900/60 rounded-xl mb-3 overflow-hidden relative">
                    {/* Placeholder for window screenshot/preview */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <Monitor className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    {/* Window State Indicators */}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      {window.state === 'minimized' && (
                        <div className="w-6 h-6 bg-yellow-500/80 rounded-full flex items-center justify-center">
                          <Minimize2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {window.state === 'maximized' && (
                        <div className="w-6 h-6 bg-green-500/80 rounded-full flex items-center justify-center">
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {window.isActive && (
                        <div className="w-6 h-6 bg-blue-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                      {window.isAlwaysOnTop && (
                        <div className="w-6 h-6 bg-purple-500/80 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className={`absolute top-2 left-2 flex space-x-1 transition-opacity ${
                      hoveredWindow === window.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      {/* Close Button */}
                      <button
                        onClick={(e) => handleWindowClose(window.id, e)}
                        className="w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center transition-colors hover:bg-red-600/80"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      
                      {/* Minimize/Restore Button */}
                      <button
                        onClick={(e) => handleWindowToggle(window.id, e)}
                        className="w-6 h-6 bg-blue-500/80 rounded-full flex items-center justify-center transition-colors hover:bg-blue-600/80"
                      >
                        <Minimize2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Window Title */}
                  <div className="text-center">
                    <h3 className="text-white font-medium text-sm truncate" title={window.title}>
                      {window.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {window.state === 'minimized' ? 'Minimized' : 
                       window.state === 'maximized' ? 'Maximized' :
                       window.isActive ? 'Active' : 'Background'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              {searchQuery ? (
                <>
                  <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No windows found</h3>
                  <p className="text-gray-400">Try a different search term</p>
                </>
              ) : (
                <>
                  <Monitor className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No windows open</h3>
                  <p className="text-gray-400">Open an application to see it here</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <span>Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+↑</kbd> to open</span>
            <span>Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd> to close</span>
            <span>Click window to switch</span>
          </div>
        </div>
      </animated.div>
    ) : null
  );
};

export default WindowOverview;