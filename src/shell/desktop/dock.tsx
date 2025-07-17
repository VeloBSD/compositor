import React, { useState } from 'react';
import {
  Home,
  FileText,
  Image,
  Music,
  Video,
  Settings,
  Terminal,
  Globe,
  Mail,
  Calculator,
  Calendar,
  Folder
} from 'lucide-react';

interface DockItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const DockItem: React.FC<DockItemProps> = ({ icon, label, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative group">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {label}
        </div>
      )}
      
      {/* Icon */}
      <button
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg
          bg-white/20 backdrop-blur-sm border border-white/30
          hover:bg-white/30 hover:scale-110 hover:-translate-y-1
          transition-all duration-200 ease-out
          shadow-lg hover:shadow-xl
          ${isHovered ? 'scale-110 -translate-y-1' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <div className="text-white w-6 h-6">
          {icon}
        </div>
      </button>
    </div>
  );
};

const Dock: React.FC = () => {
  const dockItems = [
    { icon: <Home size={24} />, label: 'Home' },
    { icon: <Folder size={24} />, label: 'Files' },
    { icon: <Globe size={24} />, label: 'Browser' },
    { icon: <FileText size={24} />, label: 'Text Editor' },
    { icon: <Terminal size={24} />, label: 'Terminal' },
    { icon: <Mail size={24} />, label: 'Mail' },
    { icon: <Calendar size={24} />, label: 'Calendar' },
    { icon: <Calculator size={24} />, label: 'Calculator' },
    { icon: <Image size={24} />, label: 'Images' },
    { icon: <Music size={24} />, label: 'Music' },
    { icon: <Video size={24} />, label: 'Videos' },
    { icon: <Settings size={24} />, label: 'Settings' },
  ];

  const handleItemClick = (label: string) => {
    console.log(`Clicked: ${label}`);
    // Add your application launch logic here
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="
        flex items-center gap-2 px-4 py-3
        bg-black/40 backdrop-blur-md rounded-2xl
        border border-white/20 shadow-2xl
        transition-all duration-300 ease-out
      ">
        {dockItems.map((item, index) => (
          <DockItem
            key={index}
            icon={item.icon}
            label={item.label}
            onClick={() => handleItemClick(item.label)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dock;