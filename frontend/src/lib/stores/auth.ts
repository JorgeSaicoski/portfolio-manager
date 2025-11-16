import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const AUTHENTIK_URL = import.meta.env.VITE_AUTHENTIK_URL || 'http://localhost:9000';
const AUTHENTIK_CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || 'portfolio-manager';
const AUTHENTIK_REDIRECT_URI = import.meta.env.VITE_AUTHENTIK_REDIRECT_URI || 'http://localhost:3000/auth/callback';
const AUTHENTIK_ISSUER = import.meta.env.VITE_AUTHENTIK_ISSUER || 'http://localhost:9000/application/o/portfolio-manager/';

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

// Type definitions for Authentik OIDC user
export interface User {
  sub: string;                // Authentik user ID
  email: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
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
  accessToken: null,
  idToken: null,
  loading: false,
  error: null
};

// Helper function to generate random string for PKCE
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

// Helper function to create SHA256 hash for PKCE
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

// Helper function to base64url encode
function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create the auth store
function createAuthStore(): AuthStore {
  const { subscribe, set, update }: Writable<AuthState> = writable(initialState);

  return {
    subscribe,

    // Initialize auth state from cookies and localStorage
    init(): void {
      if (browser) {
        const accessToken = getCookie('auth-token') || localStorage.getItem('accessToken');
        const idToken = getCookie('id-token') || localStorage.getItem('idToken');
        const userStr = getCookie('auth-user') || localStorage.getItem('user');

        if (accessToken && idToken && userStr) {
          try {
            const user: User = JSON.parse(userStr);
            this.setAuth(accessToken, idToken, user);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            this.clearAuth();
          }
        }
      }
    },

    // Set authentication state
    setAuth(accessToken: string, idToken: string, user: User): void {
      update(state => ({
        ...state,
        isAuthenticated: true,
        user,
        accessToken,
        idToken,
        error: null
      }));

      if (browser) {
        // Store in both cookies and localStorage for compatibility
        setCookie('auth-token', accessToken, 7); // 7 days
        setCookie('id-token', idToken, 7);
        setCookie('auth-user', JSON.stringify(user), 7);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
    },

    // Clear authentication state
    clearAuth(): void {
      set(initialState);

      if (browser) {
        // Clear both cookies and localStorage
        deleteCookie('auth-token');
        deleteCookie('id-token');
        deleteCookie('auth-user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('user');
        localStorage.removeItem('code_verifier');
        localStorage.removeItem('oauth_state');
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

    // Initiate OAuth2 login flow
    async login(): Promise<void> {
      if (!browser) return;

      try {
        // Generate PKCE code verifier and challenge
        const codeVerifier = generateRandomString(128);
        const codeChallenge = base64urlEncode(await sha256(codeVerifier));

        // Generate state for CSRF protection
        const state = generateRandomString(32);

        // Store code verifier and state in localStorage
        localStorage.setItem('code_verifier', codeVerifier);
        localStorage.setItem('oauth_state', state);

        // Build authorization URL
        const authUrl = new URL(`${AUTHENTIK_URL}/application/o/authorize/`);
        authUrl.searchParams.set('client_id', AUTHENTIK_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', AUTHENTIK_REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        // Redirect to Authentik login
        window.location.href = authUrl.toString();
      } catch (error) {
        console.error('Error initiating OAuth login:', error);
        this.setError('Failed to initiate login');
      }
    },

    // Handle OAuth2 callback
    async handleCallback(code: string, state: string): Promise<ApiResponse<User>> {
      if (!browser) return { success: false, error: 'Not in browser environment' };

      this.setLoading(true);
      this.setError('');

      try {
        // Verify state to prevent CSRF
        const storedState = localStorage.getItem('oauth_state');
        if (!storedState || storedState !== state) {
          throw new Error('Invalid state parameter');
        }

        // Get code verifier
        const codeVerifier = localStorage.getItem('code_verifier');
        if (!codeVerifier) {
          throw new Error('Missing code verifier');
        }

        // Exchange authorization code for tokens
        const tokenUrl = `${AUTHENTIK_URL}/application/o/token/`;
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: AUTHENTIK_CLIENT_ID,
            redirect_uri: AUTHENTIK_REDIRECT_URI,
            code: code,
            code_verifier: codeVerifier,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('Token exchange failed:', errorData);
          throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokens: TokenResponse = await tokenResponse.json();

        // Decode ID token to get user info
        const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        const user: User = {
          sub: idTokenPayload.sub,
          email: idTokenPayload.email,
          email_verified: idTokenPayload.email_verified || false,
          name: idTokenPayload.name || idTokenPayload.email,
          preferred_username: idTokenPayload.preferred_username || idTokenPayload.email,
          given_name: idTokenPayload.given_name,
          family_name: idTokenPayload.family_name,
          nickname: idTokenPayload.nickname,
        };

        // Set auth state
        this.setAuth(tokens.access_token, tokens.id_token, user);

        // Clean up PKCE data
        localStorage.removeItem('code_verifier');
        localStorage.removeItem('oauth_state');

        return { success: true, data: user };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        this.setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        this.setLoading(false);
      }
    },

    // Register new user (redirect to Authentik enrollment flow)
    async register(username: string, email: string, password: string): Promise<ApiResponse<void>> {
      if (!browser) return { success: false, error: 'Not in browser environment' };

      try {
        // Authentik enrollment flow URL
        // The default enrollment flow allows users to self-register
        const enrollmentUrl = new URL(`${AUTHENTIK_URL}/if/flow/default-enrollment-flow/`);

        // Optional: Pre-fill email if supported by your enrollment flow configuration
        // This requires custom configuration in Authentik's enrollment flow
        if (email) {
          enrollmentUrl.searchParams.set('email', email);
        }

        // Store registration attempt for potential error recovery
        // This helps users retry if enrollment flow is not configured
        if (browser) {
          sessionStorage.setItem('registration_attempt', JSON.stringify({
            username,
            email,
            timestamp: new Date().toISOString()
          }));
        }

        // Redirect to Authentik enrollment/registration page
        // Note: If enrollment flow doesn't exist, user will see 404
        // See docs/authentication/enrollment-setup.md for setup instructions
        window.location.href = enrollmentUrl.toString();

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initiate registration';
        this.setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },

    // Logout function
    async logout(): Promise<void> {
      const state = this.getCurrentState();

      // Clear local auth state
      this.clearAuth();

      // Redirect to Authentik logout endpoint
      if (browser && state.idToken) {
        const logoutUrl = new URL(`${AUTHENTIK_URL}/application/o/portfolio-manager/end-session/`);
        logoutUrl.searchParams.set('id_token_hint', state.idToken);
        logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);

        window.location.href = logoutUrl.toString();
      } else if (browser) {
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
      if (!state.idToken) return true;

      try {
        const payload: any = JSON.parse(atob(state.idToken.split('.')[1]));
        const now = Date.now() / 1000;
        return payload.exp < now;
      } catch (error) {
        return true;
      }
    },

    // Refresh token if needed
    async ensureAuth(): Promise<boolean> {
      const state = this.getCurrentState();
      if (!state.accessToken || this.isTokenExpired()) {
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
  setAuth(accessToken: string, idToken: string, user: User): void;
  clearAuth(): void;
  setLoading(loading: boolean): void;
  setError(error: string): void;
  login(): Promise<void>;
  register(username: string, email: string, password: string): Promise<ApiResponse<void>>;
  handleCallback(code: string, state: string): Promise<ApiResponse<User>>;
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
  return state.accessToken ? {
    'Authorization': `Bearer ${state.accessToken}`,
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
