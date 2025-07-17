// WebSocket API Client for VLDWM API
interface WebSocketMessage {
    type: string;
    data?: any;
    id?: string;
}

interface LoginMessage extends WebSocketMessage {
    type: 'login';
    username: string;
    password: string;
}

interface DesktopSessionMessage extends WebSocketMessage {
    type: 'desktop_session';
    action: string;
    params?: any;
}

interface SystemStatusMessage extends WebSocketMessage {
    type: 'system_status';
}

class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private messageHandlers = new Map<string, (data: any) => void>();
    private connectionPromise: Promise<void> | null = null;
    private isConnecting = false;

    constructor(url: string) {
        this.url = url;
    }

    async connect(): Promise<void> {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return this.connectionPromise || Promise.resolve();
        }

        this.isConnecting = true;
        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log('🔗 WebSocket connected to VLDWM API');
                    this.reconnectAttempts = 0;
                    this.isConnecting = false;
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };

                this.ws.onclose = (event) => {
                    console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                    this.isConnecting = false;
                    this.ws = null;
                    
                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnecting = false;
                    reject(error);
                };
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect().catch(console.error);
        }, delay);
    }

    private handleMessage(message: WebSocketMessage): void {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        } else {
            console.log('📨 Unhandled WebSocket message:', message);
        }
    }

    onMessage(type: string, handler: (data: any) => void): void {
        this.messageHandlers.set(type, handler);
    }

    offMessage(type: string): void {
        this.messageHandlers.delete(type);
    }

    async sendMessage(message: WebSocketMessage): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            await this.connect();
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            throw new Error('WebSocket is not connected');
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.messageHandlers.clear();
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}

// Singleton WebSocket client instance
const wsClient = new WebSocketClient('ws://localhost:3001');

// WebSocket API Service
export class WebSocketAPIService {
    private static instance: WebSocketAPIService;
    private client: WebSocketClient;
    private responseHandlers = new Map<string, { resolve: (data: any) => void; reject: (error: any) => void; timeout: NodeJS.Timeout }>();

    private constructor() {
        this.client = wsClient;
        this.setupMessageHandlers();
    }

    static getInstance(): WebSocketAPIService {
        if (!WebSocketAPIService.instance) {
            WebSocketAPIService.instance = new WebSocketAPIService();
        }
        return WebSocketAPIService.instance;
    }

    private setupMessageHandlers(): void {
        this.client.onMessage('welcome', (message) => {
            console.log('👋 Welcome message:', message.message);
        });

        this.client.onMessage('login', (message) => {
            this.handleResponse('login', message);
        });

        this.client.onMessage('desktop_session', (message) => {
            this.handleResponse('desktop_session', message);
        });

        this.client.onMessage('system_status', (message) => {
            this.handleResponse('system_status', message);
        });

        this.client.onMessage('error', (message) => {
            console.error('🚨 Server error:', message);
        });
    }

    private handleResponse(type: string, data: any): void {
        const handler = this.responseHandlers.get(type);
        if (handler) {
            clearTimeout(handler.timeout);
            this.responseHandlers.delete(type);
            handler.resolve(data);
        }
    }

    private async sendRequestWithResponse<T>(message: WebSocketMessage, timeout = 10000): Promise<T> {
        await this.client.connect();
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.responseHandlers.delete(message.type);
                reject(new Error(`Request timeout for ${message.type}`));
            }, timeout);

            this.responseHandlers.set(message.type, { resolve, reject, timeout: timeoutId });
            
            this.client.sendMessage(message).catch((error) => {
                clearTimeout(timeoutId);
                this.responseHandlers.delete(message.type);
                reject(error);
            });
        });
    }

    async connect(): Promise<void> {
        return this.client.connect();
    }

    async login(username: string, password: string): Promise<any> {
        const message: LoginMessage = {
            type: 'login',
            username,
            password
        };
        
        return this.sendRequestWithResponse(message);
    }

    async getSystemStatus(): Promise<any> {
        const message: SystemStatusMessage = {
            type: 'system_status'
        };
        
        return this.sendRequestWithResponse(message);
    }

    async desktopSessionAction(action: string, params?: any): Promise<any> {
        const message: DesktopSessionMessage = {
            type: 'desktop_session',
            action,
            params
        };
        
        return this.sendRequestWithResponse(message);
    }

    onRealtimeMessage(type: string, handler: (data: any) => void): void {
        this.client.onMessage(type, handler);
    }

    offRealtimeMessage(type: string): void {
        this.client.offMessage(type);
    }

    disconnect(): void {
        this.client.disconnect();
    }

    isConnected(): boolean {
        return this.client.isConnected();
    }
}

export default WebSocketAPIService;