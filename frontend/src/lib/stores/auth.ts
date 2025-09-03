import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/auth';

// Cookie helper functions
function setCookie(name: string, value: string, days: number = 7) {
  if (!browser) return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  if (!browser) return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string) {
  if (!browser) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Type definitions
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// Create the auth store
function createAuthStore(): AuthStore {
  const { subscribe, set, update }: Writable<AuthState> = writable(initialState);

  return {
    subscribe,
    
    // Initialize auth state from cookies and localStorage
    init(): void {
      if (browser) {
        const token = getCookie('auth-token') || localStorage.getItem('authToken');
        const userStr = getCookie('auth-user') || localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user: User = JSON.parse(userStr);
            this.setAuth(token, user);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            this.clearAuth();
          }
        }
      }
    },

    // Set authentication state
    setAuth(token: string, user: User): void {
      update(state => ({
        ...state,
        isAuthenticated: true,
        user,
        token,
        error: null
      }));

      if (browser) {
        // Store in both cookies and localStorage for compatibility
        setCookie('auth-token', token, 7); // 7 days
        setCookie('auth-user', JSON.stringify(user), 7);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },

    // Clear authentication state
    clearAuth(): void {
      set(initialState);
      
      if (browser) {
        // Clear both cookies and localStorage
        deleteCookie('auth-token');
        deleteCookie('auth-user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    },

    // Set loading state
    setLoading(loading: boolean): void {
      update(state => ({
        ...state,
        loading
      }));
    },

    // Set error state
    setError(error: string): void {
      update(state => ({
        ...state,
        error,
        loading: false
      }));
    },

    // Login function
    async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
      this.setLoading(true);
      this.setError('');

      try {
        console.log('Starting login attempt...');
        const response = await fetch(`${AUTH_API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password } as LoginRequest)
        });

        const data: AuthResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as any).error || 'Login failed');
        }

        console.log('Auth response received:', data);
        this.setAuth(data.token, data.user);
        console.log('Auth state updated');
        return { success: true, data };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        this.setLoading(false);
      }
    },

    // Register function
    async register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> {
      this.setLoading(true);
      this.setError('');

      try {
        const response = await fetch(`${AUTH_API_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password } as RegisterRequest)
        });

        const data: AuthResponse = await response.json();

        if (!response.ok) {
          throw new Error((data as any).error || 'Registration failed');
        }

        this.setAuth(data.token, data.user);
        return { success: true, data };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        this.setLoading(false);
      }
    },

    // Logout function
    async logout(): Promise<void> {
      this.clearAuth();
      
      // Navigate to login page
      if (browser) {
        goto('/auth/login');
      }
    },

    // Get current state (helper for non-reactive contexts)
    getCurrentState(): AuthState {
      let currentState: AuthState;
      const unsubscribe = subscribe(state => {
        currentState = state;
      });
      unsubscribe();
      return currentState!;
    },

    // Check if token is expired (basic check)
    isTokenExpired(): boolean {
      const state = this.getCurrentState();
      if (!state.token) return true;

      try {
        const payload: any = JSON.parse(atob(state.token.split('.')[1]));
        const now = Date.now() / 1000;
        return payload.exp < now;
      } catch (error) {
        return true;
      }
    },

    // Refresh token if needed
    async ensureAuth(): Promise<boolean> {
      const state = this.getCurrentState();
      if (!state.token || this.isTokenExpired()) {
        this.clearAuth();
        return false;
      }
      return true;
    }
  };
}

// Auth store interface
export interface AuthStore {
  subscribe: Writable<AuthState>['subscribe'];
  init(): void;
  setAuth(token: string, user: User): void;
  clearAuth(): void;
  setLoading(loading: boolean): void;
  setError(error: string): void;
  login(email: string, password: string): Promise<ApiResponse<AuthResponse>>;
  register(username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>>;
  logout(): Promise<void>;
  getCurrentState(): AuthState;
  isTokenExpired(): boolean;
  ensureAuth(): Promise<boolean>;
}

// Create and export the auth store
export const auth: AuthStore = createAuthStore();

// Auto-initialize when the module is imported
if (browser) {
  auth.init();
}

// Helper function to get auth headers for API calls
export function getAuthHeaders(): Record<string, string> {
  const state = auth.getCurrentState();
  return state.token ? {
    'Authorization': `Bearer ${state.token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
}

// Helper function for authenticated API calls
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  if (!auth.ensureAuth()) {
    throw new Error('Not authenticated');
  }

  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    auth.clearAuth();
    throw new Error('Authentication expired');
  }

  return response;
}