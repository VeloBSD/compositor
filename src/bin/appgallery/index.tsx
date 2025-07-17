import React, { useState } from 'react';
import WindowedContainer from '../../components/veloui/windowed';
import {
  Home,
  FileText,
  Image,
  Music,
  Video,
  Settings,
  Terminal,
  Globe,
  Power,
  Mail,
  Calculator,
  Calendar,
  Folder,
  ChevronRight,
  Moon,
  RotateCcw,
  Zap,
  Minus,
  Square,
  X
} from 'lucide-react';

interface GallerySection {
  title: string;
  items: GalleryItem[];
}

interface GalleryItem {
  name: string;
  component: React.ReactNode;
  description: string;
}

const AppGallery: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('Buttons');

  // Mock handlers
  const handleMinimize = () => console.log('Minimize clicked');
  const handleMaximize = () => console.log('Maximize clicked');
  const handleClose = () => console.log('Close clicked');

  // Button examples
  const buttonSection: GallerySection = {
    title: 'Buttons',
    items: [
      {
        name: 'Dock Button',
        description: 'Button used in the dock component with hover effects',
        component: (
          <div className="flex flex-col items-center gap-4">
            <button
              className={`
                w-12 h-12 flex items-center justify-center rounded-lg
                bg-white/20 backdrop-blur-sm border border-white/30
                hover:bg-white/30 hover:scale-110 hover:-translate-y-1
                transition-all duration-200 ease-out
                shadow-lg hover:shadow-xl
              `}
            >
              <div className="text-white w-6 h-6">
                <Terminal size={24} />
              </div>
            </button>
            <button
              className={`
                w-12 h-12 flex items-center justify-center rounded-lg
                bg-white/20 backdrop-blur-sm border border-white/30
                hover:bg-white/30 hover:scale-110 hover:-translate-y-1
                transition-all duration-200 ease-out
                shadow-lg hover:shadow-xl
              `}
            >
              <div className="text-white w-6 h-6">
                <Settings size={24} />
              </div>
            </button>
          </div>
        )
      },
      {
        name: 'Power Button',
        description: 'Button used for power options',
        component: (
          <div className="flex flex-col items-center gap-4">
            <button
              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <Power className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <Moon className="w-5 h-5 text-zinc-300" />
              </button>
              <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <RotateCcw className="w-5 h-5 text-zinc-300" />
              </button>
              <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
                <Zap className="w-5 h-5 text-zinc-300" />
              </button>
            </div>
          </div>
        )
      },
    ]
  };

  // Window controls
  const windowSection: GallerySection = {
    title: 'Window Controls',
    items: [
      {
        name: 'Window Controls',
        description: 'Controls for window management',
        component: (
          <div className="flex items-center space-x-3 bg-zinc-800 p-2 rounded">
            <div
              className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-zinc-700 rounded transition-colors"
            >
              <Minus className="w-3 h-3 text-zinc-400" />
            </div>
            <div
              className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-zinc-700 rounded transition-colors"
            >
              <Square className="w-3 h-3 text-zinc-400" />
            </div>
            <div
              className="w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-zinc-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        )
      },
      {
        name: 'Window Container',
        description: 'Example of a nested window container',
        component: (
          <div className="scale-75 origin-top-left">
            <WindowedContainer
              title="Nested Window"
              onMinimize={() => {}}
              onMaximize={() => {}}
              onClose={() => {}}
            >
              <div className="text-sm text-zinc-300">
                This is a nested window container example
              </div>
            </WindowedContainer>
          </div>
        )
      },
    ]
  };

  // Form elements
  const formSection: GallerySection = {
    title: 'Form Elements',
    items: [
      {
        name: 'Text Input',
        description: 'Standard text input field',
        component: (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <label className="text-xs text-zinc-400">Username</label>
            <input
              type="text"
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Enter username"
            />
          </div>
        )
      },
      {
        name: 'Password Input',
        description: 'Password input with login button',
        component: (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-zinc-400">Password</label>
              <input
                type="password"
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter password"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors">
              Login
            </button>
          </div>
        )
      },
    ]
  };

  // Navigation elements
  const navSection: GallerySection = {
    title: 'Navigation',
    items: [
      {
        name: 'Menu Item',
        description: 'Interactive menu item with hover effect',
        component: (
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <div className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-300">Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded flex items-center justify-between cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-zinc-300">Terminal</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        )
      },
    ]
  };

  const sections: GallerySection[] = [
    buttonSection,
    windowSection,
    formSection,
    navSection
  ];

  return (
    <WindowedContainer
      title="UI Gallery"
      onMinimize={handleMinimize}
      onMaximize={handleMaximize}
      onClose={handleClose}
    >
      <div className="flex h-[500px] overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-zinc-800 pr-2">
          <h2 className="text-xs font-semibold text-zinc-500 mb-2 uppercase">Components</h2>
          <nav>
            {sections.map((section) => (
              <button
                key={section.title}
                className={`w-full text-left px-3 py-2 rounded text-sm ${activeSection === section.title ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'} transition-colors`}
                onClick={() => setActiveSection(section.title)}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto pl-4">
          <div className="py-2">
            <h2 className="text-lg font-medium text-white mb-4">{activeSection}</h2>
            
            {sections
              .find(section => section.title === activeSection)?.items
              .map((item, index) => (
                <div key={index} className="mb-8">
                  <h3 className="text-sm font-medium text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-zinc-400 mb-3">{item.description}</p>
                  <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                    {item.component}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </WindowedContainer>
  );
};

export default AppGallery;