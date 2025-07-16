// types/auth.ts
export interface UserInfo {
    username: string;
    uid: number;
    gid: number;
    home: string;
    shell: string;
    fullname: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    user?: UserInfo;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface ApiError {
    success: false;
    message: string;
    error?: string;
}

// config/api.ts
export const API_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    ENDPOINTS: {
        LOGIN: '/api/login',
        LOGOUT: '/api/logout',
        STATUS: '/api/status',
    },
    TIMEOUT: 10000, // 10 seconds
} as const;

// utils/apiClient.ts
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

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

// services/authService.ts
export class AuthService {
    private static instance: AuthService;
    private currentUser: UserInfo | null = null;

    private constructor() {}

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async authenticateUser(username: string, password: string): Promise<LoginResponse> {
        try {
            // Validate input
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
                this.saveUserSession(response.user);
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
        this.clearUserSession();
    }

    getCurrentUser(): UserInfo | null {
        return this.currentUser;
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    private saveUserSession(user: UserInfo): void {
        // Store user info in memory (no localStorage in Claude artifacts)
        this.currentUser = user;
    }

    private clearUserSession(): void {
        this.currentUser = null;
    }

    // Load user session on app start
    initializeSession(): void {
        // In a real app, you'd load from localStorage or check with server
        // For now, just ensure we start with no session
        this.currentUser = null;
    }
}

// hooks/useAuth.ts
import { useState, useCallback } from 'react';

export interface UseAuthReturn {
    isLoading: boolean;
    error: string | null;
    user: UserInfo | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearError: () => void;
}

export function useAuth(): UseAuthReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<UserInfo | null>(null);

    const authService = AuthService.getInstance();

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
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
    }, []);

    const logout = useCallback(async (): Promise<void> => {
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
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading,
        error,
        user,
        login,
        logout,
        clearError,
    };
}

// utils/validation.ts
export const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
        return 'Username is required';
    }
    
    if (username.length < 2) {
        return 'Username must be at least 2 characters';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    return null;
};

export const validatePassword = (password: string): string | null => {
    if (!password) {
        return 'Password is required';
    }
    
    if (password.length < 1) {
        return 'Password cannot be empty';
    }
    
    return null;
};

// Simple standalone function (your original approach)
export async function authenticateUser(username: string, password: string): Promise<LoginResponse> {
    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        return await response.json();
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Authentication failed',
        };
    }
}