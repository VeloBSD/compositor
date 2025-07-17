import { KeyboardEvent, useState, useEffect } from 'react';
import ProfilePic from '../../assets/avatar.jpg';
import { PowerButton } from './powerbutton';
import { ContextMenu, useContextMenu } from './contextmenu';
import { UserSelect } from './userselect';
import { LoginForm } from './loginform';

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
            return;
        }

        announceToScreenReader('Attempting to log in');
        const success = await login(selectedUser.username, password);

        if (!success) {
            setIsShaking(true);
            announceToScreenReader('Login failed. Please check your password and try again.');
            setTimeout(() => setIsShaking(false), 500);
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

    if (isUserSelectMode) {
        return (
            <UserSelect
                availableUsers={availableUsers}
                onUserSelect={handleUserSelect}
                onBackToLogin={handleUserSwitch}
                announcement={announcement}
                contextMenu={contextMenu}
                showContextMenu={showContextMenu}
                hideContextMenu={hideContextMenu}
            />
        );
    }

    return (
        <LoginForm
            selectedUser={selectedUser}
            password={password}
            setPassword={setPassword}
            isLoading={isLoading}
            error={error}
            isShaking={isShaking}
            announcement={announcement}
            onSubmit={handleSubmit}
            onUserSwitch={handleUserSwitch}
            contextMenu={contextMenu}
            showContextMenu={showContextMenu}
            hideContextMenu={hideContextMenu}
        />
    );
}

export default Login;