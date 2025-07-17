import { KeyboardEvent, useState, useEffect, useRef } from 'react';
import { RefreshCw, Settings, Info } from 'lucide-react';

// Context Menu Hook
export function useContextMenu() {
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

// Context Menu Component
export function ContextMenu({
    visible,
    x,
    y,
    onClose
}: {
    visible: boolean;
    x: number;
    y: number;
    onClose: () => void;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);

    const menuItems = [
        { id: 'refresh', label: 'Refresh', icon: RefreshCw, action: () => window.location.reload() },
        { id: 'settings', label: 'Settings', icon: Settings, action: () => alert('Settings not implemented') },
        { id: 'about', label: 'About', icon: Info, action: () => alert('System Login v1.0') },
    ];

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % menuItems.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                menuItems[focusedIndex].action();
                onClose();
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
            className="fixed bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
            style={{
                left: Math.min(x, window.innerWidth - 200),
                top: Math.min(y, window.innerHeight - 150),
            }}
        >
            {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                    <button
                        key={item.id}
                        role="menuitem"
                        onClick={() => {
                            item.action();
                            onClose();
                        }}
                        onMouseEnter={() => setFocusedIndex(index)}
                        className={`w-full px-2 py-2 text-left text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-3 focus:outline-none focus:bg-white/20 ${
                            focusedIndex === index ? 'bg-white/20' : ''
                        }`}
                    >
                        <IconComponent size={14} aria-hidden="true" />
                        <span className="text-xs">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
}