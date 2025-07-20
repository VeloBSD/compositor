import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Wifi,
  WifiOff,
  User,
  Shield,
  Clock,
  Palette,
  Download,
  CheckCircle,
  Globe,
  FileText,
  Settings,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';

interface UserData {
  username: string;
  password: string;
  fullName: string;
  timezone: string;
  theme: 'light' | 'dark';
  privacy: {
    analytics: boolean;
    location: boolean;
    diagnostics: boolean;
  };
  network: {
    connected: boolean;
    ssid: string;
  };
}

function Oobe() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    username: '',
    password: '',
    fullName: '',
    timezone: '',
    theme: 'dark',
    privacy: {
      analytics: false,
      location: false,
      diagnostics: true
    },
    network: {
      connected: false,
      ssid: ''
    }
  });

  // Auto-detect timezone on component mount
  useEffect(() => {
    const detectTimezone = () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setUserData(prev => ({ ...prev, timezone }));
      } catch (error) {
        console.error('Failed to detect timezone:', error);
        setUserData(prev => ({ ...prev, timezone: 'UTC' }));
      }
    };

    detectTimezone();
  }, []);

  const steps = [
    'Welcome',
    'License Agreement',
    'Network Setup',
    'Update Check',
    'Create Local User',
    'Device Personalization',
    'Privacy Settings',
    'Time Zone',
    'Finalizing Setup'
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateUserData = (field: string, value: any) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedUserData = (parent: string, field: string, value: any) => {
    setUserData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof UserData] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  // Welcome Screen
  const WelcomeScreen = () => (
    <div className="text-center space-y-10">
      <div className="space-y-8">
        <div className="relative">

          <Globe className="relative w-20 h-20 mx-auto text-gray-300 drop-shadow-sm" />
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Welcome to VeloBSD
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto font-light leading-relaxed">
            Let's set up your new system. This will only take a few minutes.
          </p>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-sm mx-auto shadow-2xl">
        <h3 className="font-medium text-gray-200 mb-6 text-lg">Setup includes:</h3>
        <ul className="text-sm text-gray-300 space-y-4 text-left">
          <li className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-light">Network connection</span>
          </li>
          <li className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-light">User account</span>
          </li>
          <li className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-light">Privacy preferences</span>
          </li>
          <li className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="font-light">Personalization</span>
          </li>
        </ul>
      </div>
    </div>
  );

  // License Agreement Screen
  const LicenseScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <FileText className="w-16 h-16 mx-auto text-gray-400 drop-shadow-sm" />
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-white tracking-tight">Software License Agreement</h2>
          <p className="text-gray-400 font-light max-w-xl mx-auto">
            Please read and understand the terms before using the software to ensure clarity and fairness for everyone.
          </p>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-md h-96 overflow-y-auto shadow-inner">
        <div className="text-sm text-gray-300 space-y-6 leading-relaxed font-light max-w-xl mx-auto">
          <h3 className="font-semibold text-white text-lg mb-4">BSD 3-Clause License Summary</h3>
          <p>
            This software is provided under the BSD 3-Clause License, which allows you to use, modify, and distribute it freely with the following main conditions:
          </p>
          <div className="space-y-4">
            <p>
              <span className="font-medium text-gray-200">1. Permission to Use and Distribute:</span> You may use this software for any purpose, including modifying and distributing the original or modified versions.
            </p>
            <p>
              <span className="font-medium text-gray-200">2. Preservation of Notices:</span> You must retain the original copyright notice and license text in all copies or substantial portions of the software, whether source or binary.
            </p>
            <p>
              <span className="font-medium text-gray-200">3. No Endorsement:</span> You may not use the names of the original contributors or organizations to promote derived products without prior permission.
            </p>
            <p>
              <span className="font-medium text-gray-200">4. Disclaimer of Warranty:</span> The software is provided “as is” without any warranties, express or implied, including but not limited to merchantability or fitness for a particular purpose.
            </p>
            <p>
              <span className="font-medium text-gray-200">5. Limitation of Liability:</span> The authors are not liable for any damages arising from the use of the software, whether direct, indirect, or consequential.
            </p>
          </div>
          <p className="mt-6 font-light text-gray-400 text-xs">
            If you do not agree with these terms, please do not install or use this software.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center space-x-4">
        <input
          type="checkbox"
          id="accept"
          className="w-5 h-5 text-gray-500 bg-white/10 border-white/20 rounded-md focus:ring-gray-500 focus:ring-2 focus:ring-offset-0"
        />
        <label htmlFor="accept" className="text-sm text-gray-300 font-light cursor-pointer select-none">
          I have read and agree to the software license agreement.
        </label>
      </div>
    </div>
  );



  // Network Setup Screen
  const NetworkScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <Wifi className="w-16 h-16 mx-auto text-gray-300 drop-shadow-sm" />
        <div className="space-y-3">
          <h2 className="text-4xl font-light text-white tracking-tight">Connect to Wi-Fi</h2>
          <p className="text-gray-400 font-light">Choose a network to connect to the internet.</p>
        </div>
      </div>
      <div className="space-y-3 max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 cursor-pointer transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Wifi className="w-5 h-5 text-gray-200" />
              <div>
                <div className="font-medium text-white">Home-WiFi-5G</div>
                <div className="text-xs text-gray-400 font-light">WPA2 • Strong signal</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 cursor-pointer transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Wifi className="w-5 h-5 text-gray-300" />
              <div>
                <div className="font-medium text-white">Office-Network</div>
                <div className="text-xs text-gray-400 font-light">WPA2 • Medium signal</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 cursor-pointer transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <WifiOff className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium text-gray-300">Set up later</div>
                <div className="text-xs text-gray-500 font-light">Continue without Wi-Fi</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );

  // Update Check Screen
  const UpdateScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <Download className="w-16 h-16 mx-auto text-gray-300 drop-shadow-sm" />
        <div className="space-y-3">
          <h2 className="text-4xl font-light text-white tracking-tight">Software Update</h2>
          <p className="text-gray-400 font-light">Checking for the latest updates.</p>
        </div>
      </div>
      <div className="space-y-6 max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-lg">
          <div className="flex items-center space-x-4 mb-6">
            <CheckCircle className="w-6 h-6 text-gray-200" />
            <span className="font-medium text-gray-200">Your software is up to date</span>
          </div>
          <div className="text-sm text-gray-300 space-y-3 font-light">
            <div className="flex justify-between items-center">
              <span>Version:</span>
              <span className="text-white font-medium">Velocity OS 25.07</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Security:</span>
              <span className="text-gray-200">Current</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Last checked:</span>
              <span className="text-gray-400">Just now</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <button className="text-gray-300 hover:text-gray-200 text-sm font-light transition-colors underline decoration-gray-500 underline-offset-4">
            Check for updates manually
          </button>
        </div>
      </div>
    </div>
  );

  // Create User Screen (Friendly Linux-style setup)
  const CreateUserScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <User className="w-16 h-16 mx-auto text-gray-300 drop-shadow-sm" />
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-white tracking-tight">Create Your User Account</h2>
          <p className="text-gray-400 font-light max-w-md mx-auto">
            This will be your main account on this system — your identity and password to log in and manage your settings.
            Don’t worry, you can always change these later if needed.
          </p>
        </div>
      </div>
      <div className="space-y-6 max-w-sm mx-auto">
        <div>
          <label className="block text-sm font-light text-gray-300 mb-3">Full Name</label>
          <input
            type="text"
            className="w-full px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent text-white placeholder-gray-500 transition-all font-light shadow-lg"
            placeholder="Enter your full name"
            value={userData.fullName}
            onChange={(e) => updateUserData('fullName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-light text-gray-300 mb-3">Username</label>
          <input
            type="text"
            className="w-full px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent text-white placeholder-gray-500 transition-all font-light shadow-lg"
            placeholder="Choose a username (no spaces, all lowercase)"
            value={userData.username}
            onChange={(e) => updateUserData('username', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1 font-light">
            This will be your login name, so keep it simple.
          </p>
        </div>
        <div>
          <label className="block text-sm font-light text-gray-300 mb-3">Password</label>
          <input
            type="password"
            className="w-full px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent text-white placeholder-gray-500 transition-all font-light shadow-lg"
            placeholder="Create a strong password"
            value={userData.password}
            onChange={(e) => updateUserData('password', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1 font-light">
            Use at least 8 characters, mixing letters and numbers.
          </p>
        </div>
        <div>
          <label className="block text-sm font-light text-gray-300 mb-3">Confirm Password</label>
          <input
            type="password"
            className="w-full px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent text-white placeholder-gray-500 transition-all font-light shadow-lg"
            placeholder="Re-enter your password"
            value=""
            onChange={(e) => updateUserData('confirmPassword', e.target.value)}
          />
        </div>
      </div>
    </div>
  );


  // Device Personalization Screen
  const PersonalizationScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <Palette className="w-16 h-16 mx-auto text-gray-300 drop-shadow-sm" />
        <div className="space-y-3">
          <h2 className="text-4xl font-light text-white tracking-tight">Appearance</h2>
          <p className="text-gray-400 font-light">Choose how your system looks.</p>
        </div>
      </div>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-light text-white mb-6 text-center">Select your appearance</h3>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div
              className={`border-2 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-lg ${userData.theme === 'light' ? 'border-gray-400 bg-white/10 shadow-xl' : 'border-white/20 hover:border-white/30'
                }`}
              onClick={() => updateUserData('theme', 'light')}
            >
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <div className="h-3 bg-gray-200 rounded-full mb-2"></div>
                <div className="h-2 bg-gray-100 rounded-full"></div>
              </div>
              <div className="text-center font-light text-white flex items-center justify-center space-x-2">
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </div>
            </div>
            <div
              className={`border-2 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-lg ${userData.theme === 'dark' ? 'border-gray-400 bg-white/10 shadow-xl' : 'border-white/20 hover:border-white/30'
                }`}
              onClick={() => updateUserData('theme', 'dark')}
            >
              <div className="bg-gray-800 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="h-3 bg-gray-600 rounded-full mb-2"></div>
                <div className="h-2 bg-gray-700 rounded-full"></div>
              </div>
              <div className="text-center font-light text-white flex items-center justify-center space-x-2">
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </div>
            </div>
            <div
              className={`border-2 rounded-3xl p-6 cursor-pointer transition-all duration-300 shadow-lg ${userData.theme === 'dark' ? 'border-gray-400 bg-white/10 shadow-xl' : 'border-white/20 hover:border-white/30'
                }`}
              onClick={() => updateUserData('theme', 'system')}
            >
              <div className="bg-gradient-to-r from-white to-gray-800 rounded-2xl p-4 mb-4 shadow-sm">
                <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-600 rounded-full mb-2"></div>
                <div className="h-2 bg-gradient-to-r from-gray-100 to-gray-700 rounded-full"></div>
              </div>
              <div className="text-center font-light text-white flex items-center justify-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Auto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Privacy Settings Screen
  const PrivacyScreen = () => (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <Shield className="w-16 h-16 mx-auto text-gray-300 drop-shadow-sm" />
        <div className="space-y-3">
          <h2 className="text-4xl font-light text-white tracking-tight">Privacy</h2>
          <p className="text-gray-400 font-light">Choose your privacy preferences.</p>
        </div>
      </div>
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-white mb-1">Analytics & Diagnostics</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed">Share analytics data to help improve the system</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-6">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={userData.privacy.analytics}
                onChange={(e) => updateNestedUserData('privacy', 'analytics', e.target.checked)}
              />
              <div className="w-12 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-800/50 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-500 shadow-inner"></div>
            </label>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-white mb-1">Location Services</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed">Allow apps to use your location when appropriate</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-6">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={userData.privacy.location}
                onChange={(e) => updateNestedUserData('privacy', 'location', e.target.checked)}
              />
              <div className="w-12 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-800/50 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-500 shadow-inner"></div>
            </label>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-white mb-1">Crash Reports</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed">Automatically send crash reports to help fix issues</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-6">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={userData.privacy.diagnostics}
                onChange={(e) => updateNestedUserData('privacy', 'diagnostics', e.target.checked)}
              />
              <div className="w-12 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-800/50 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gray-500 shadow-inner"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Time Zone Screen
  const TimeZoneScreen = () => {
    const getCurrentTime = () => {
      const now = new Date();
      return {
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    };

    const { time, date } = getCurrentTime();

    return (
      <div className="space-y-8">
        <div className="text-center space-y-6">
          <Clock className="w-16 h-16 mx-auto text-gray-300 drop-shadow-sm" />
          <div className="space-y-3">
            <h2 className="text-4xl font-light text-white tracking-tight">Time Zone</h2>
            <p className="text-gray-400 font-light">We've detected your time zone automatically.</p>
          </div>
        </div>
        <div className="max-w-sm mx-auto space-y-6">
          <div>
            <label className="block text-sm font-light text-gray-300 mb-3">Select Time Zone</label>
            <select
              className="w-full px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-transparent text-white transition-all font-light shadow-lg appearance-none"
              value={userData.timezone}
              onChange={(e) => updateUserData('timezone', e.target.value)}
            >
              <option value="UTC" className="bg-gray-800">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York" className="bg-gray-800">Eastern Time (US & Canada)</option>
              <option value="America/Chicago" className="bg-gray-800">Central Time (US & Canada)</option>
              <option value="America/Denver" className="bg-gray-800">Mountain Time (US & Canada)</option>
              <option value="America/Los_Angeles" className="bg-gray-800">Pacific Time (US & Canada)</option>
              <option value="Europe/London" className="bg-gray-800">London (GMT)</option>
              <option value="Europe/Paris" className="bg-gray-800">Paris (CET)</option>
              <option value="Europe/Berlin" className="bg-gray-800">Berlin (CET)</option>
              <option value="Asia/Tokyo" className="bg-gray-800">Tokyo (JST)</option>
              <option value="Asia/Shanghai" className="bg-gray-800">Shanghai (CST)</option>
              <option value="Asia/Kolkata" className="bg-gray-800">India (IST)</option>
              <option value="Australia/Sydney" className="bg-gray-800">Sydney (AEST)</option>
              <option value="Pacific/Auckland" className="bg-gray-800">Auckland (NZST)</option>
            </select>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-lg">
            <div className="text-center space-y-3">
              <div className="text-3xl font-light text-white">{time}</div>
              <div className="text-sm text-gray-400 font-light">{date}</div>
              <div className="text-xs text-gray-500 font-light">{userData.timezone}</div>
            </div>
          </div>
          {userData.timezone && (
            <div className="text-center">
              <button
                onClick={() => {
                  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  updateUserData('timezone', timezone);
                }}
                className="text-gray-300 hover:text-gray-200 text-sm font-light transition-colors underline decoration-gray-500 underline-offset-4"
              >
                Detect automatically
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Finalizing Setup Screen
  const FinalizingScreen = () => (
    <div className="text-center space-y-10">
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-gray-400/10 rounded-full blur-2xl scale-150"></div>
          <Settings className="relative w-20 h-20 mx-auto text-gray-300 animate-spin drop-shadow-sm" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-light text-white tracking-tight">Setting Up</h2>
          <p className="text-lg text-gray-400 font-light">Configuring your system...</p>
        </div>
      </div>
      <div className="max-w-sm mx-auto space-y-5">
        <div className="flex items-center space-x-4 text-left">
          <CheckCircle className="w-5 h-5 text-gray-200 flex-shrink-0" />
          <span className="text-gray-300 font-light">User account created</span>
        </div>
        <div className="flex items-center space-x-4 text-left">
          <CheckCircle className="w-5 h-5 text-gray-200 flex-shrink-0" />
          <span className="text-gray-300 font-light">Privacy settings applied</span>
        </div>
        <div className="flex items-center space-x-4 text-left">
          <CheckCircle className="w-5 h-5 text-gray-200 flex-shrink-0" />
          <span className="text-gray-300 font-light">Appearance configured</span>
        </div>
        <div className="flex items-center space-x-4 text-left">
          <CheckCircle className="w-5 h-5 text-gray-200 flex-shrink-0" />
          <span className="text-gray-300 font-light">Time zone set</span>
        </div>
        <div className="flex items-center space-x-4 text-left">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
          <span className="text-gray-300 font-light">Finalizing setup...</span>
        </div>
      </div>
      <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-1.5 shadow-inner">
        <div className="bg-gradient-to-r from-gray-400 to-gray-300 h-1.5 rounded-full transition-all duration-1000 shadow-sm" style={{ width: '85%' }}></div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeScreen />;
      case 1: return <LicenseScreen />;
      case 2: return <NetworkScreen />;
      case 3: return <UpdateScreen />;
      case 4: return <CreateUserScreen />;
      case 5: return <PersonalizationScreen />;
      case 6: return <PrivacyScreen />;
      case 7: return <TimeZoneScreen />;
      case 8: return <FinalizingScreen />;
      default: return <WelcomeScreen />;
    }
  };

  return (
    <div className="min-h-screen from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Progress Bar - macOS style */}
      <div className="w-full bg-black/40 backdrop-blur-2xl border-b border-white/5 fixed">
        <div className="max-w-4xl mx-auto px-8 py-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-light text-gray-300">
              {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-400 font-light">{steps[currentStep]}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 shadow-inner">
            <div
              className="bg-gradient-to-r from-gray-400 to-gray-300 h-1.5 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          <div className="bg-black/20 backdrop-blur-3xl rounded-[1rem] shadow-2xl p-12 min-h-[650px] flex flex-col">
            <div className="flex-1">
              {renderCurrentStep()}
            </div>

            {/* Navigation Buttons - macOS style */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center space-x-3 px-8 py-2 rounded-2xl font-light transition-all duration-300 ${currentStep === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 backdrop-blur-xl shadow-lg'
                  }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>

              <div className="flex space-x-3">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-500 ${index === currentStep
                      ? 'bg-gray-300 w-8 shadow-sm'
                      : index < currentStep
                        ? 'bg-gray-400 w-2'
                        : 'bg-gray-600 w-2'
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                disabled={currentStep === steps.length - 1}
                className={`flex items-center space-x-3 px-8 py-2 rounded-2xl font-light transition-all duration-300 shadow-lg ${currentStep === steps.length - 1
                  ? 'bg-gray-600 text-white cursor-default backdrop-blur-xl'
                  : ' text-white hover:bg-white/20 backdrop-blur-xl border border-white/20'
                  }`}
              >
                <span>{currentStep === steps.length - 1 ? 'Continue' : 'Continue'}</span>
                {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Oobe;