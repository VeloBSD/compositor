import { KeyboardEvent, useState, useEffect, useRef } from 'react';
import { Power, Moon, RotateCcw, Zap } from 'lucide-react';

export function PowerButton() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const powerOptions = [
        { id: 'sleep', label: 'Sleep', icon: Moon, action: () => alert('System going to sleep...') },
        { id: 'restart', label: 'Restart', icon: RotateCcw, action: () => alert('System restarting...') },
        { id: 'shutdown', label: 'Shut Down', icon: Zap, action: () => alert('System shutting down...') },
    ];

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!isMenuOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % powerOptions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + powerOptions.length) % powerOptions.length);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                powerOptions[focusedIndex].action();
                setIsMenuOpen(false);
                break;
            case 'Escape':
                e.preventDefault();
                setIsMenuOpen(false);
                buttonRef.current?.focus();
                break;
        }
    };

    const handleOptionClick = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (!isMenuOpen) {
            setFocusedIndex(0);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleMenu();
                    }
                }}
                aria-label="Power options"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent flex items-center justify-center"
            >
                <Power size={20} aria-hidden="true" />
            </button>

            {isMenuOpen && (
                <div
                    role="menu"
                    aria-orientation="vertical"
                    onKeyDown={handleKeyDown}
                    className="absolute bottom-14 right-0 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 py-1"
                >
                    {powerOptions.map((option, index) => {
                        const IconComponent = option.icon;
                        return (
                            <button
                                key={option.id}
                                role="menuitem"
                                onClick={() => handleOptionClick(option.action)}
                                onMouseEnter={() => setFocusedIndex(index)}
                                className={`w-full px-2 py-1 text-left text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-3 focus:outline-none focus:bg-white/20 ${
                                    focusedIndex === index ? 'bg-white/20' : ''
                                }`}
                            >
                                <IconComponent size={14} aria-hidden="true" />
                                <span className='text-xs'>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}