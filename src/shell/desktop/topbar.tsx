import React, { useState, useEffect } from 'react';
import { useMenu, MenuItem } from '@/components/global/hook/usemenu';
import { useActiveWindow } from '@/components/global/hook/useactivewindow';
import { RefreshCw, Settings, Info, Bell, Wifi, Volume2, Battery } from 'lucide-react';

// Regional configuration constants
const REGION_CONFIG = {
    locale: 'th-TH', // Thai locale for Thailand
    timezone: 'Asia/Bangkok',
    dateFormat: {
        weekday: 'short' as const,
        day: '2-digit' as const,
        month: 'short' as const
    },
    timeFormat: {
        hour: '2-digit' as const,
        minute: '2-digit' as const,
        hour12: false // 24-hour format common in Thailand
    }
};

interface TopbarProps {
    onSync?: () => void;
}

function Topbar({ onSync }: TopbarProps) {
    const [now, setNow] = useState(new Date());
    const { menuState, menuRef, toggleMenu, closeMenu } = useMenu();
    const { activeWindow } = useActiveWindow();

    // Update time every minute
    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, []);

    const currentTime = now.toLocaleTimeString(REGION_CONFIG.locale, {
        ...REGION_CONFIG.timeFormat,
        timeZone: REGION_CONFIG.timezone
    });

    const currentDate = now.toLocaleDateString(REGION_CONFIG.locale, {
        ...REGION_CONFIG.dateFormat,
        timeZone: REGION_CONFIG.timezone
    });

    // Define menu items
    const fileMenuItems: MenuItem[] = [
        { id: 'new', label: 'New', action: () => console.log('New') },
        { id: 'open', label: 'Open', action: () => console.log('Open') },
        { id: 'save', label: 'Save', action: () => console.log('Save') },
        { id: 'exit', label: 'Exit', action: () => console.log('Exit') },
    ];

    const editMenuItems: MenuItem[] = [
        { id: 'undo', label: 'Undo', action: () => console.log('Undo') },
        { id: 'redo', label: 'Redo', action: () => console.log('Redo') },
        { id: 'cut', label: 'Cut', action: () => console.log('Cut') },
        { id: 'copy', label: 'Copy', action: () => console.log('Copy') },
        { id: 'paste', label: 'Paste', action: () => console.log('Paste') },
    ];

    const helpMenuItems: MenuItem[] = [
        { id: 'about', label: 'About', action: () => console.log('About') },
        { id: 'help', label: 'Help', action: () => console.log('Help') },
    ];

    const systemMenuItems: MenuItem[] = [
        { id: 'wifi', label: 'Wi-Fi Settings', action: () => console.log('Wi-Fi Settings') },
        { id: 'volume', label: 'Sound Settings', action: () => console.log('Sound Settings') },
        { id: 'battery', label: 'Power Settings', action: () => console.log('Power Settings') },
        { id: 'sync', label: 'Sync Now', action: () => onSync && onSync() },
    ];

    // Get the active menu items based on the active menu
    const getActiveMenuItems = (): MenuItem[] => {
        switch (menuState.activeMenu) {
            case 'file':
                return fileMenuItems;
            case 'edit':
                return editMenuItems;
            case 'help':
                return helpMenuItems;
            case 'system':
                return systemMenuItems;
            default:
                return [];
        }
    };

    return (
        <>
            <div className="h-8 fixed text-xs w-screen flex items-center justify-between px-4 z-20 invert">
                <div className="items-center gap-2 flex">
                    <div>
                        <b className='font-extrabold'>Workspace</b>
                    </div>
                    <div className="border-r border-black h-4 opacity-40" />
                    <div className="flex items-center gap-3">
                        {/* Active Window Title */}
                        <div className="text-xs font-extrabold">
                            {activeWindow ? activeWindow.title : 'Velobsd Demo'}
                        </div>
                        {/* Application Menu */}
                        <div
                            className="hover:bg-black/10 px-2 py-1 rounded cursor-pointer font-medium"
                            onClick={(e) => toggleMenu('file', e.currentTarget.getBoundingClientRect().left, e.currentTarget.getBoundingClientRect().bottom)}
                        >
                            File
                        </div>
                        <div
                            className="hover:bg-black/10 px-2 py-1 rounded cursor-pointer font-medium"
                            onClick={(e) => toggleMenu('edit', e.currentTarget.getBoundingClientRect().left, e.currentTarget.getBoundingClientRect().bottom)}
                        >
                            Edit
                        </div>
                        <div
                            className="hover:bg-black/10 px-2 py-1 rounded cursor-pointe font-medium"
                            onClick={(e) => toggleMenu('help', e.currentTarget.getBoundingClientRect().left, e.currentTarget.getBoundingClientRect().bottom)}
                        >
                            Help
                        </div>
                    </div>


                </div>

                <div className="flex items-center gap-3">
                    {/* System Tray */}
                    <div className="flex items-center gap-2">
                        <div
                            className="hover:bg-black/10 p-1 rounded cursor-pointer"
                            onClick={onSync}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </div>
                        <div className="hover:bg-black/10 p-1 rounded cursor-pointer">
                            <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div className="hover:bg-black/10 p-1 rounded cursor-pointer">
                            <Wifi className="h-3.5 w-3.5" />
                        </div>
                        <div className="hover:bg-black/10 p-1 rounded cursor-pointer">
                            <Volume2 className="h-3.5 w-3.5" />
                        </div>
                        <div
                            className="hover:bg-black/10 p-1 rounded cursor-pointer"
                            onClick={(e) => toggleMenu('system', e.currentTarget.getBoundingClientRect().right - 150, e.currentTarget.getBoundingClientRect().bottom)}
                        >
                            <Battery className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div className="border-r border-black h-4 opacity-40" />
                    <div className='font-bold'>{currentTime}</div>
                    <div className='font-bold'>{currentDate}</div>
                </div>
            </div>

            {/* Dropdown Menu */}
            {menuState.isOpen && (
                <div
                    ref={menuRef}
                    className="fixed border border-[#4b4b4b] shadow-lg rounded-md  z-50 min-w-[150px] text-white backdrop-blur-md bg-[#20202057]"
                    style={{
                        top: `${menuState.position.y}px`,
                        left: `${menuState.position.x}px`
                    }}
                >
                    {getActiveMenuItems().map((item) => (
                        <div
                            key={item.id}
                            className="px-2 py-2 hover:bg-[#ffffff21] cursor-pointer text-xs"
                            onClick={() => {
                                if (item.action) item.action();
                                closeMenu();
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default Topbar;