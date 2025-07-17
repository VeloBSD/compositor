import { KeyboardEvent } from 'react';
import { PowerButton } from './powerbutton';
import { ContextMenu } from './contextmenu';
import Topbar from '../topbar';
import { defaultConfig } from '../../config/default';

const wallpaper = defaultConfig.ui.wallpaper;

interface User {
    username: string;
    displayName: string;
    avatar: string;
}

interface UserSelectProps {
    availableUsers: User[];
    onUserSelect: (user: User) => void;
    onBackToLogin: () => void;
    announcement: string;
    contextMenu: {
        visible: boolean;
        x: number;
        y: number;
    };
    showContextMenu: (e: React.MouseEvent) => void;
    hideContextMenu: () => void;
}

export function UserSelect({
    availableUsers,
    onUserSelect,
    onBackToLogin,
    announcement,
    contextMenu,
    showContextMenu,
    hideContextMenu
}: UserSelectProps) {
    const handleUserSelectKeyDown = (e: KeyboardEvent<HTMLButtonElement>, user: User) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onUserSelect(user);
        }
    };

    return (
        <>
            <Topbar />
            <div
                className="w-screen h-screen flex items-center justify-center overflow-hidden"
                style={{
                    backgroundImage: `url(${wallpaper.path})`,
                    backgroundSize: wallpaper.fit,
                    opacity: wallpaper.opacity,
                    filter: wallpaper.blur ? "blur(8px)" : "none",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
                onContextMenu={showContextMenu}
            >
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

                {/* Screen reader announcements */}
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {announcement}
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex flex-col space-y-4" role="list">
                        {availableUsers.map((user, index) => (
                            <button
                                key={user.username}
                                onClick={() => onUserSelect(user)}
                                onKeyDown={(e) => handleUserSelectKeyDown(e, user)}
                                className="flex items-center space-x-4 p-4 w-128 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent select-none"
                                aria-label={`Select ${user.displayName}, username: ${user.username}`}
                                role="listitem"
                                autoFocus={index === 0}
                            >
                                <div className="w-12 h-12 rounded-full bg-white/10 p-0.5 flex-shrink-0">
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '9999px',
                                            backgroundImage: `url(${user.avatar})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                        }}
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-white font-medium text-base truncate select-none">{user.displayName}</div>
                                    <div className="text-white/70 text-sm truncate select-none">/users/{user.username}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onBackToLogin}
                        className="mt-8 text-white/70 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-2 py-1"
                        aria-label="Go back to login screen"
                    >
                        Back to Login
                    </button>
                </div>

                {/* Power Button */}
                <div className="absolute bottom-6 right-6">
                    <PowerButton />
                </div>

                {/* Context Menu */}
                <ContextMenu
                    visible={contextMenu.visible}
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={hideContextMenu}
                />
            </div>
        </>
    );
}