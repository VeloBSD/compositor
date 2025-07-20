import Topbar from "./components/topbar";
import Dock from "./components/dock";
import { defaultConfig } from "../../config/default";
import Cursor from "../../assets/cursor.svg";
import { useTransition, animated } from "@react-spring/web";
import { useEffect, useState } from "react";
import { WebSocketAPIService } from "../../midleware";
import AppGallery from "@/bin/appgallery";
import SystemSettings from "@/bin/settings";
import WindowOverview from "./components/WindowOverview";

const wallpaper = defaultConfig.ui.wallpaper;

function App() {
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [wsService] = useState(() => WebSocketAPIService.getInstance());
    const [showWindowOverview, setShowWindowOverview] = useState(false);

    useEffect(() => {
        // Initialize WebSocket connection
        const initializeWebSocket = async () => {
            try {
                setConnectionStatus('connecting');
                await wsService.connect();
                setConnectionStatus('connected');

                // Set up real-time message handlers
                wsService.onRealtimeMessage('system_update', (data) => {
                    console.log('📊 System update received:', data);
                    setSystemStatus(data);
                });

                wsService.onRealtimeMessage('notification', (data) => {
                    console.log('🔔 Notification received:', data);
                    // Handle notifications here
                });

                wsService.onRealtimeMessage('desktop_event', (data) => {
                    console.log('🖥️ Desktop event received:', data);
                    // Handle desktop events here
                });

                // Get initial system status
                const status = await wsService.getSystemStatus();
                setSystemStatus(status);
            } catch (error) {
                console.error('Failed to initialize WebSocket:', error);
                setConnectionStatus('disconnected');
            }
        };

        initializeWebSocket();

        // Monitor connection status
        const statusInterval = setInterval(() => {
            if (wsService.isConnected()) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('disconnected');
            }
        }, 5000);

        return () => {
            clearInterval(statusInterval);
            wsService.offRealtimeMessage('system_update');
            wsService.offRealtimeMessage('notification');
            wsService.offRealtimeMessage('desktop_event');
        };
    }, [wsService]);

    // Keyboard event handler for window overview
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl + Arrow Up to show window overview
            if (event.ctrlKey && event.key === 'ArrowUp') {
                event.preventDefault();
                setShowWindowOverview(true);
            }
            // Escape to close window overview
            else if (event.key === 'Escape' && showWindowOverview) {
                event.preventDefault();
                setShowWindowOverview(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showWindowOverview]);

    // Connection status indicator
    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'text-green-400';
            case 'connecting': return 'text-yellow-400';
            case 'disconnected': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <main className=""
            style={{
                backgroundImage: `url(${wallpaper.path})`,
                backgroundSize: wallpaper.fit,
                opacity: wallpaper.opacity,
                filter: wallpaper.blur ? "blur(8px)" : "none",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                cursor: `url(${Cursor}) 0 0, auto`,
            }}
        >
            <Topbar />

            <div className="h-screen w-screen flex items-center justify-center">
                {/* Desktop content area */}
                {!showWindowOverview && (
                    <>
                        <SystemSettings/>
                        <AppGallery />
                    </>
                )}
            </div>

            {/* Window Overview */}
            {showWindowOverview && (
                <WindowOverview 
                    onClose={() => setShowWindowOverview(false)}
                    onWindowSelect={() => setShowWindowOverview(false)}
                />
            )}

            <Dock />
        </main>
    );
}

export default App;