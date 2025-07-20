import React, { useState, useEffect } from 'react';
import WindowedContainer from '../../components/veloui/windowed';
import { 
  Monitor, 
  Wifi, 
  Volume2, 
  Users, 
  Shield, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Network, 
  Bluetooth, 
  Palette, 
  Globe, 
  Clock, 
  Power,
  Settings,
  ChevronRight,
  Info,
  Save,
  RotateCcw
} from 'lucide-react';

interface SystemInfo {
  uptime: number;
  total_memory: number;
  free_memory: number;
  used_memory: number;
  process_count: number;
  load_average: number[];
  cpu_usage: number;
}

interface SettingsCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const settingsCategories: SettingsCategory[] = [
  { id: 'display', title: 'Display & Graphics', icon: Monitor, description: 'Screen resolution, refresh rate, multiple monitors' },
  { id: 'network', title: 'Network & Internet', icon: Wifi, description: 'Wi-Fi, Ethernet, VPN, proxy settings' },
  { id: 'audio', title: 'Sound & Audio', icon: Volume2, description: 'Output devices, input devices, volume levels' },
  { id: 'users', title: 'Users & Accounts', icon: Users, description: 'User accounts, permissions, login settings' },
  { id: 'security', title: 'Privacy & Security', icon: Shield, description: 'Firewall, encryption, access control' },
  { id: 'storage', title: 'Storage & Disks', icon: HardDrive, description: 'Disk usage, mount points, file systems' },
  { id: 'system', title: 'System Information', icon: Info, description: 'Hardware info, system status, diagnostics' },
  { id: 'appearance', title: 'Appearance & Themes', icon: Palette, description: 'Desktop themes, wallpapers, fonts' },
  { id: 'datetime', title: 'Date & Time', icon: Clock, description: 'Time zone, NTP servers, date format' },
  { id: 'power', title: 'Power Management', icon: Power, description: 'Sleep settings, power profiles, battery' },
];

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function SettingsOverview({ systemInfo }: { systemInfo: SystemInfo | null }) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          System Overview
        </h3>
        {systemInfo ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Uptime:</span>
                <span className="text-zinc-200">{formatUptime(systemInfo.uptime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Processes:</span>
                <span className="text-zinc-200">{systemInfo.process_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Load Average:</span>
                <span className="text-zinc-200">
                  {systemInfo.load_average?.map(load => load.toFixed(2)).join(', ') || 'N/A'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Memory:</span>
                <span className="text-zinc-200">{formatBytes(systemInfo.total_memory)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Used Memory:</span>
                <span className="text-zinc-200">{formatBytes(systemInfo.used_memory)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Free Memory:</span>
                <span className="text-zinc-200">{formatBytes(systemInfo.free_memory)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-400">Loading system information...</div>
        )}
      </div>
    </div>
  );
}

function DisplaySettings() {
  const [resolution, setResolution] = useState('1920x1080');
  const [refreshRate, setRefreshRate] = useState('60');
  const [scaling, setScaling] = useState('100');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
        <Monitor className="w-5 h-5 mr-2" />
        Display Settings
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Resolution</label>
          <select 
            value={resolution} 
            onChange={(e) => setResolution(e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200"
          >
            <option value="3840x2160">3840 × 2160 (4K)</option>
            <option value="2560x1440">2560 × 1440 (QHD)</option>
            <option value="1920x1080">1920 × 1080 (FHD)</option>
            <option value="1366x768">1366 × 768 (HD)</option>
            <option value="1280x720">1280 × 720 (HD)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Refresh Rate</label>
          <select 
            value={refreshRate} 
            onChange={(e) => setRefreshRate(e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200"
          >
            <option value="144">144 Hz</option>
            <option value="120">120 Hz</option>
            <option value="75">75 Hz</option>
            <option value="60">60 Hz</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Display Scaling</label>
          <select 
            value={scaling} 
            onChange={(e) => setScaling(e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200"
          >
            <option value="200">200% (Larger)</option>
            <option value="150">150%</option>
            <option value="125">125%</option>
            <option value="100">100% (Default)</option>
            <option value="75">75% (Smaller)</option>
          </select>
        </div>

        <div className="flex space-x-3 pt-4">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white flex items-center">
            <Save className="w-4 h-4 mr-2" />
            Apply
          </button>
          <button className="bg-zinc-600 hover:bg-zinc-700 px-4 py-2 rounded-md text-white flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function NetworkSettings() {
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [ethernetEnabled, setEthernetEnabled] = useState(true);
  const [proxyEnabled, setProxyEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
        <Network className="w-5 h-5 mr-2" />
        Network Settings
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div>
            <div className="font-medium text-zinc-200">Wi-Fi</div>
            <div className="text-sm text-zinc-400">Wireless network connection</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={wifiEnabled} 
              onChange={(e) => setWifiEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div>
            <div className="font-medium text-zinc-200">Ethernet</div>
            <div className="text-sm text-zinc-400">Wired network connection</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={ethernetEnabled} 
              onChange={(e) => setEthernetEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
          <div>
            <div className="font-medium text-zinc-200">Proxy Server</div>
            <div className="text-sm text-zinc-400">Use proxy for network connections</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={proxyEnabled} 
              onChange={(e) => setProxyEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {proxyEnabled && (
          <div className="space-y-3 p-3 bg-zinc-800/30 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Proxy Address</label>
              <input 
                type="text" 
                placeholder="proxy.example.com"
                className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Port</label>
              <input 
                type="number" 
                placeholder="8080"
                className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AudioSettings() {
  const [outputVolume, setOutputVolume] = useState(75);
  const [inputVolume, setInputVolume] = useState(50);
  const [outputDevice, setOutputDevice] = useState('speakers');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-zinc-200 flex items-center">
        <Volume2 className="w-5 h-5 mr-2" />
        Audio Settings
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Output Device</label>
          <select 
            value={outputDevice} 
            onChange={(e) => setOutputDevice(e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200"
          >
            <option value="speakers">Built-in Speakers</option>
            <option value="headphones">Headphones</option>
            <option value="hdmi">HDMI Audio</option>
            <option value="usb">USB Audio Device</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Output Volume: {outputVolume}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={outputVolume}
            onChange={(e) => setOutputVolume(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Input Volume: {inputVolume}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={inputVolume}
            onChange={(e) => setInputVolume(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  const [activeCategory, setActiveCategory] = useState<string>('overview');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    // Simulate fetching system information
    // In a real implementation, you would call your system API
    const fetchSystemInfo = async () => {
      try {
        // This would be replaced with actual API call to your middleware
        // const info = await middleware.getSystemStatus();
        
        // Mock data for demonstration
        const mockInfo: SystemInfo = {
          uptime: 86400 * 3 + 3600 * 5 + 60 * 30, // 3 days, 5 hours, 30 minutes
          total_memory: 16 * 1024 * 1024 * 1024, // 16 GB
          free_memory: 8 * 1024 * 1024 * 1024,   // 8 GB
          used_memory: 8 * 1024 * 1024 * 1024,   // 8 GB
          process_count: 245,
          load_average: [0.85, 1.2, 1.5],
          cpu_usage: 15.3
        };
        
        setSystemInfo(mockInfo);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    fetchSystemInfo();
  }, []);

  const renderContent = () => {
    switch (activeCategory) {
      case 'overview':
        return <SettingsOverview systemInfo={systemInfo} />;
      case 'display':
        return <DisplaySettings />;
      case 'network':
        return <NetworkSettings />;
      case 'audio':
        return <AudioSettings />;
      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              {settingsCategories.find(cat => cat.id === activeCategory)?.title || 'Settings'}
            </h3>
            <p className="text-zinc-400">
              This settings panel is under development.
            </p>
          </div>
        );
    }
  };

  return (
    <WindowedContainer 
      title="System Settings"
      initialSize={{ width: 900, height: 700 }}
      minSize={{ width: 600, height: 500 }}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-800 ">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-zinc-200 mb-4">Settings</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveCategory('overview')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center ${
                  activeCategory === 'overview'
                    ? 'bg-white text-zinc-800'
                    : 'text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Info className="w-4 h-4 mr-3" />
                Overview
              </button>
              
              {settingsCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${
                      activeCategory === category.id
                        ? 'bg-white text-zinc-800'
                        : 'text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="w-4 h-4 mr-3" />
                      {category.title}
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </WindowedContainer>
  );
}

export default SystemSettings;