import { KeyboardEvent, useRef } from 'react';
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

interface LoginFormProps {
    selectedUser: User;
    password: string;
    setPassword: (password: string) => void;
    isLoading: boolean;
    error: string | null;
    isShaking: boolean;
    announcement: string;
    onSubmit: (e: React.FormEvent | KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => void;
    onUserSwitch: () => void;
    contextMenu: {
        visible: boolean;
        x: number;
        y: number;
    };
    showContextMenu: (e: React.MouseEvent) => void;
    hideContextMenu: () => void;
}

export function LoginForm({
    selectedUser,
    password,
    setPassword,
    isLoading,
    error,
    isShaking,
    announcement,
    onSubmit,
    onUserSwitch,
    contextMenu,
    showContextMenu,
    hideContextMenu
}: LoginFormProps) {
    const passwordInputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <Topbar />
            <div
                className="w-screen h-screen flex items-center justify-center overflow-hidden"
                onContextMenu={showContextMenu}
                style={{
                    backgroundImage: `url(${wallpaper.path})`,
                    backgroundSize: wallpaper.fit,
                    opacity: wallpaper.opacity,
                    filter: wallpaper.blur ? "blur(8px)" : "none",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                {/* Background blur effect */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

                {/* Screen reader announcements */}
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                    {announcement}
                </div>

                {/* Login container */}
                <main className={`relative z-10 flex flex-col items-center transition-all duration-300 ${isShaking ? 'animate-shake' : ''}`}>
                    {/* Profile picture */}
                    <div className="mb-6">
                        <div className="w-32 h-32 rounded-full bg-white/10 p-0.5 backdrop-blur-sm">
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '9999px',
                                    backgroundImage: `url(${selectedUser.avatar})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                }}
                                aria-label={`Profile picture for ${selectedUser.displayName}`}
                                role="img"
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <h1 className="text-white text-xl font-bold mb-8 -tracking-wide">
                        {selectedUser.displayName}
                    </h1>

                    {/* Login form */}
                    <div className="w-80">
                        <div className="relative mb-6">
                            <label htmlFor="password" className="sr-only">
                                Password for {selectedUser.displayName}
                            </label>
                            <input
                                id="password"
                                ref={passwordInputRef}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 placeholder:text-xs"
                                autoFocus
                                disabled={isLoading}
                                aria-invalid={error ? 'true' : 'false'}
                                aria-describedby={error ? 'password-error' : undefined}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        onSubmit(e);
                                    }
                                }}
                            />
                            {error && (
                                <div
                                    id="password-error"
                                    className="text-red-400 text-sm mt-2 text-center"
                                    role="alert"
                                    aria-live="polite"
                                >
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            onClick={onSubmit}
                            disabled={isLoading}
                            className="w-full py-1 text-xs border border-white/20 text-white font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                            aria-label={isLoading ? 'Logging in, please wait' : 'Log in to system'}
                        >
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>
                    </div>

                    {/* Bottom options */}
                    <div className="mt-8 flex flex-col items-center space-y-4">
                        <button
                            onClick={onUserSwitch}
                            className="text-white/70 hover:text-white text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-2 py-1"
                            aria-label="Switch to different user account"
                        >
                            Switch User
                        </button>
                    </div>
                </main>

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

                {/* Custom CSS for shake animation */}
                <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `}</style>
            </div>
        </>
    );
}