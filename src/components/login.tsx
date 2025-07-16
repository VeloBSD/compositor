import { KeyboardEvent, useState, useEffect, useRef } from 'react';
import { Power, Moon, RotateCcw, Zap, RefreshCw, Settings, Info } from 'lucide-react';
import ProfilePic from '../assets/avatar.jpg';
import Topbar from './topbar';
import { defaultConfig } from "../config/default";

// Types from your API
interface UserInfo {
    username: string;
    uid: number;
    gid: number;
    home: string;
    shell: string;
    fullname: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    user?: UserInfo;
}

interface LoginRequest {
    username: string;
    password: string;
}

const wallpaper = defaultConfig.ui.wallpaper;


// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    ENDPOINTS: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        STATUS: '/api/status',
    },
    TIMEOUT: 10000,
} as const;

// API Client
class ApiClient {
    private baseURL: string;
    private timeout: number;

    constructor(baseURL: string, timeout: number = 10000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            }

            throw new Error('Unknown error occurred');
        }
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'GET',
        });
    }
}

const apiClient = new ApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

// Auth Service
class AuthService {
    private static instance: AuthService;
    private currentUser: UserInfo | null = null;

    private constructor() { }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async authenticateUser(username: string, password: string): Promise<LoginResponse> {
        try {
            if (!username.trim()) {
                return {
                    success: false,
                    message: 'Username is required',
                };
            }

            if (!password.trim()) {
                return {
                    success: false,
                    message: 'Password is required',
                };
            }

            const loginData: LoginRequest = { username, password };

            const response = await apiClient.post<LoginResponse>(
                API_CONFIG.ENDPOINTS.LOGIN,
                loginData
            );

            if (response.success && response.user) {
                this.currentUser = response.user;
            }

            return response;
        } catch (error) {
            console.error('Authentication error:', error);

            return {
                success: false,
                message: error instanceof Error ? error.message : 'Authentication failed',
            };
        }
    }

    async logout(): Promise<void> {
        this.currentUser = null;
    }

    getCurrentUser(): UserInfo | null {
        return this.currentUser;
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }
}

// useAuth Hook
function useAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserInfo | null>(null);

    const authService = AuthService.getInstance();

    const login = async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.authenticateUser(username, password);

            if (response.success) {
                setUser(response.user || null);
                return true;
            } else {
                setError(response.message);
                return false;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        setIsLoading(true);

        try {
            await authService.logout();
            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    return {
        isLoading,
        error,
        user,
        login,
        logout,
        clearError,
    };
}

// Power Button Component
function PowerButton() {
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
                                className={`w-full px-2 py-1 text-left text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-3 focus:outline-none focus:bg-white/20 ${focusedIndex === index ? 'bg-white/20' : ''
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

// Context Menu Hook
function useContextMenu() {
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
function ContextMenu({
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
                        className={`w-full px-2 py-2 text-left text-white hover:bg-white/20 transition-all duration-200 flex items-center space-x-3 focus:outline-none focus:bg-white/20 ${focusedIndex === index ? 'bg-white/20' : ''
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

// Main Login Component
function Login() {
    const [password, setPassword] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [isUserSelectMode, setIsUserSelectMode] = useState(false);
    const [availableUsers] = useState([
        { username: 'ariz', displayName: 'Ariz Kamizuki', avatar: ProfilePic },
        { username: 'demo', displayName: 'Demo User', avatar: ProfilePic },
    ]);
    const [selectedUser, setSelectedUser] = useState(availableUsers[0]);
    const [announcement, setAnnouncement] = useState('');

    const { isLoading, error, user, login, clearError } = useAuth();
    const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();

    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Announcements for screen readers
    const announceToScreenReader = (message: string) => {
        setAnnouncement(message);
        setTimeout(() => setAnnouncement(''), 3000);
    };

    // Clear error when password changes
    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [password, clearError]);

    // Handle successful login
    useEffect(() => {
        if (user) {
            announceToScreenReader('Login successful. Redirecting to desktop.');
            setTimeout(() => {
                window.location.href = '/desktop';
            }, 1000);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent | KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!password.trim()) {
            setIsShaking(true);
            announceToScreenReader('Please enter a password');
            setTimeout(() => setIsShaking(false), 500);
            passwordInputRef.current?.focus();
            return;
        }

        announceToScreenReader('Attempting to log in');
        const success = await login(selectedUser.username, password);

        if (!success) {
            setIsShaking(true);
            announceToScreenReader('Login failed. Please check your password and try again.');
            setTimeout(() => setIsShaking(false), 500);
            passwordInputRef.current?.focus();
        }

        setPassword('');
    };

    const handleUserSwitch = () => {
        setIsUserSelectMode(!isUserSelectMode);
        setPassword('');
        clearError();
        announceToScreenReader(isUserSelectMode ? 'Returning to login screen' : 'Switching to user selection');
    };

    const handleUserSelect = (user: typeof availableUsers[0]) => {
        setSelectedUser(user);
        setIsUserSelectMode(false);
        setPassword('');
        clearError();
        announceToScreenReader(`Selected user: ${user.displayName}`);
    };

    // Handle keyboard navigation in user select mode
    const handleUserSelectKeyDown = (e: KeyboardEvent<HTMLButtonElement>, user: typeof availableUsers[0]) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleUserSelect(user);
        }
    };

    if (isUserSelectMode) {
        return (
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
                    <h1 className="text-white text-2xl font-bold mb-8">Select User</h1>

                    <div className="flex flex-col space-y-4" role="list">
                        {availableUsers.map((user, index) => (
                            <button
                                key={user.username}
                                onClick={() => handleUserSelect(user)}
                                onKeyDown={(e) => handleUserSelectKeyDown(e, user)}
                                className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                aria-label={`Select ${user.displayName}, username: ${user.username}`}
                                role="listitem"
                                autoFocus={index === 0}
                            >
                                <div className="w-16 h-16 rounded-full bg-white/10 p-0.5">
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
                                <div className="text-left">
                                    <div className="text-white font-medium">{user.displayName}</div>
                                    <div className="text-white/70 text-sm">{user.username}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleUserSwitch}
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
        );
    }

    return (
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
                            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 placeholder:text-sm"
                            autoFocus
                            disabled={isLoading}
                            aria-invalid={error ? 'true' : 'false'}
                            aria-describedby={error ? 'password-error' : undefined}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSubmit(e);
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
                        disabled={isLoading}
                        className="w-full py-3 text-sm border border-white/20 text-white font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                        aria-label={isLoading ? 'Logging in, please wait' : 'Log in to system'}
                    >
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                </div>

                {/* Bottom options */}
                <div className="mt-8 flex flex-col items-center space-y-4">
                    <button
                        onClick={handleUserSwitch}
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
    );
}

export default Login;