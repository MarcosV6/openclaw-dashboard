// WebSocket client for OpenClaw gateway
// Implements the gateway protocol v3 (connect challenge/response)

const TAILSCALE_GATEWAY = process.env.NEXT_PUBLIC_TAILSCALE_GATEWAY || '';
const LOCAL_GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'ws://127.0.0.1:18789';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || '';

function resolveGatewayUrl(): string {
  if (typeof window === 'undefined') return LOCAL_GATEWAY;
  const host = window.location.hostname;
  // If on localhost, use local WS. Otherwise use Tailscale serve URL.
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    return LOCAL_GATEWAY;
  }
  return TAILSCALE_GATEWAY;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

type MessageHandler = (message: ChatMessage) => void;
type StateHandler = (state: ConnectionState) => void;

function uuid(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export type ChatEventHandler = (event: { state: string; runId?: string; stream?: string; error?: string }) => void;

export class GatewayClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateHandlers: Set<StateHandler> = new Set();
  private chatEventHandlers: Set<ChatEventHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;
  private authToken: string;
  private pendingRequests: Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }> = new Map();
  private connectNonce: string | null = null;
  private connectSent = false;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectResolve: (() => void) | null = null;
  private connectReject: ((e: Error) => void) | null = null;

  constructor(private url: string = resolveGatewayUrl(), token?: string) {
    this.authToken = token || AUTH_TOKEN;
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStateChange(handler: StateHandler) {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  onChatEvent(handler: ChatEventHandler) {
    this.chatEventHandlers.add(handler);
    return () => this.chatEventHandlers.delete(handler);
  }

  private notifyMessage(message: ChatMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyState(state: ConnectionState) {
    this.stateHandlers.forEach(handler => handler(state));
  }

  // Send a JSON-RPC style request to the gateway
  private request(method: string, params: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('gateway not connected'));
    }

    const id = uuid();
    const msg = { type: 'req', id, method, params };
    const promise = new Promise<any>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
    });

    this.ws.send(JSON.stringify(msg));
    return promise;
  }

  // Send the connect handshake matching gateway protocol v3
  private async sendConnect() {
    if (this.connectSent) return;
    this.connectSent = true;

    if (this.connectTimer !== null) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    const auth = this.authToken ? { token: this.authToken } : undefined;

    const params: Record<string, any> = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'webchat-ui',
        version: '0.1.0',
        platform: 'web',
        mode: 'webchat',
        instanceId: uuid(),
      },
      role: 'operator',
      scopes: ['operator.admin'],
      caps: [],
      auth,
    };

    try {
      await this.request('connect', params);
      this.notifyState({ connected: true, connecting: false, error: null });
      this.reconnectAttempts = 0;
      this.connectResolve?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connect failed';
      this.notifyState({ connected: false, connecting: false, error: msg });
      this.connectReject?.(new Error(msg));
    }
  }

  // Queue connect with delay (gateway may need time after open)
  private queueConnect() {
    this.connectNonce = null;
    this.connectSent = false;
    if (this.connectTimer !== null) clearTimeout(this.connectTimer);
    this.connectTimer = setTimeout(() => this.sendConnect(), 750);
  }

  private handleMessage(raw: string) {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    // Handle events
    if (data.type === 'event') {
      if (data.event === 'connect.challenge') {
        // Gateway sent a nonce challenge - respond with connect
        const nonce = data.payload?.nonce;
        if (nonce && typeof nonce === 'string') {
          this.connectNonce = nonce;
          this.sendConnect();
        }
        return;
      }

      // Handle chat streaming events
      if (data.event === 'chat') {
        const payload = data.payload || {};
        const state = payload.state; // 'delta', 'final', 'error', 'aborted'
        const message = payload.message;

        // Extract text from message content
        let text = '';
        if (message) {
          const content = message.content;
          if (typeof content === 'string') {
            text = content;
          } else if (Array.isArray(content)) {
            text = content
              .filter((c: any) => c.type === 'text' && typeof c.text === 'string')
              .map((c: any) => c.text)
              .join('\n');
          } else if (typeof message.text === 'string') {
            text = message.text;
          }
        }

        // Notify chat event handlers (for streaming UI)
        this.chatEventHandlers.forEach(handler => handler({
          state,
          runId: payload.runId,
          stream: text,
          error: payload.errorMessage,
        }));

        // On final, emit a complete message
        if (state === 'final' && text) {
          this.notifyMessage({
            id: payload.runId || uuid(),
            role: 'assistant',
            content: text,
            timestamp: new Date().toISOString(),
            model: message?.model,
          });
        }

        if (state === 'error') {
          this.notifyMessage({
            id: uuid(),
            role: 'system',
            content: 'Error: ' + (payload.errorMessage || 'Unknown error'),
            timestamp: new Date().toISOString(),
          });
        }
        return;
      }

      return;
    }

    // Handle responses to pending requests
    if (data.type === 'res') {
      const pending = this.pendingRequests.get(data.id);
      if (pending) {
        this.pendingRequests.delete(data.id);
        if (data.ok) {
          pending.resolve(data.payload);
        } else {
          pending.reject(new Error(data.error?.message || 'request failed'));
        }
      }
      return;
    }
  }

  connect(): Promise<void> {
    // Prevent parallel connection attempts
    if (this.isConnecting) {
      return Promise.reject(new Error('Already connecting'));
    }

    // Clean up any previous connection
    this.cleanup();

    return new Promise((resolve, reject) => {
      this.isConnecting = true;
      this.connectResolve = resolve;
      this.connectReject = reject;

      try {
        this.notifyState({ connected: false, connecting: true, error: null });
        this.ws = new WebSocket(this.url);

        const timeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN) {
            this.ws.close();
          }
          this.isConnecting = false;
          this.notifyState({ connected: false, connecting: false, error: 'Connection timeout' });
          reject(new Error('Connection timeout'));
        }, 15000);

        this.ws.addEventListener('open', () => {
          clearTimeout(timeout);
          // Queue the connect handshake (gateway will send challenge first)
          this.queueConnect();
        });

        this.ws.addEventListener('message', (event) => {
          this.handleMessage(String(event.data ?? ''));
        });

        this.ws.addEventListener('error', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.notifyState({ connected: false, connecting: false, error: 'WebSocket error' });
          reject(new Error('WebSocket error'));
        });

        this.ws.addEventListener('close', (event) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          const reason = event.reason || 'closed';
          this.ws = null;

          // Reject all pending requests
          for (const [, pending] of this.pendingRequests) {
            pending.reject(new Error(`gateway closed (${event.code}): ${reason}`));
          }
          this.pendingRequests.clear();

          this.notifyState({ connected: false, connecting: false, error: null });

          // Only auto-reconnect on unexpected close, not during initial connect
          if (event.code !== 1000 && event.code !== 1012) {
            this.attemptReconnect();
          }
        });
      } catch (error) {
        this.isConnecting = false;
        this.notifyState({
          connected: false,
          connecting: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        });
        reject(error);
      }
    });
  }

  // Reset internal handshake state between connection attempts
  private cleanup() {
    this.connectSent = false;
    this.connectNonce = null;
    if (this.connectTimer !== null) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'cleanup');
      this.ws = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyState({
        connected: false,
        connecting: false,
        error: 'Max reconnection attempts reached'
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => { this.connect().catch(() => {}); }, delay);
  }

  // Send a chat message to the agent
  send(content: string, sessionKey: string = 'main'): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;

    this.request('chat.send', {
      sessionKey,
      message: content,
      deliver: false,
      idempotencyKey: uuid(),
    }).catch(err => {
      console.error('Failed to send message:', err);
    });

    return true;
  }

  // Load chat history
  async loadHistory(sessionKey: string = 'main', limit: number = 100): Promise<ChatMessage[]> {
    try {
      const result = await this.request('chat.history', { sessionKey, limit });
      const messages: ChatMessage[] = (result.messages || []).map((msg: any) => ({
        id: uuid(),
        role: msg.role || 'assistant',
        content: Array.isArray(msg.content)
          ? msg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n')
          : (msg.content || ''),
        timestamp: msg.time || new Date().toISOString(),
        model: msg.model,
      }));
      return messages;
    } catch (err) {
      console.error('Failed to load history:', err);
      return [];
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.notifyState({ connected: false, connecting: false, error: null });
  }

  getState(): ConnectionState {
    if (!this.ws) return { connected: false, connecting: false, error: null };
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return { connected: false, connecting: true, error: null };
      case WebSocket.OPEN:
        return { connected: true, connecting: false, error: null };
      default:
        return { connected: false, connecting: false, error: null };
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }
}

let client: GatewayClient | null = null;

export function getGatewayClient(): GatewayClient {
  if (!client) {
    client = new GatewayClient();
  }
  return client;
}
