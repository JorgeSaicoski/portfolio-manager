import { browser } from "$app/environment";

const DEBUG_ENABLED = browser &&
  (import.meta.env.VITE_DEBUG === "true" ||
   import.meta.env.DEV === true ||
   (typeof localStorage !== 'undefined' && localStorage.getItem("debug") === "true"));

type LogLevel = "info" | "warn" | "error" | "request" | "response";

interface RequestLog {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ResponseLog {
  url: string;
  status: number;
  statusText: string;
  data?: unknown;
  error?: string;
}

class DebugLogger {
  private enabled: boolean;
  private prefix: string;

  constructor(prefix: string) {
    this.enabled = DEBUG_ENABLED;
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const levelEmoji = {
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
      request: "📤",
      response: "📥"
    } as Record<LogLevel, string>;

    const header = `${levelEmoji[level]} [${timestamp}] ${this.prefix} - ${message}`;
    // Use console methods directly to avoid environments without console.group
    if (level === 'error') {
      console.error(header, ...args);
    } else if (level === 'warn') {
      console.warn(header, ...args);
    } else {
      console.log(header, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    this.formatMessage("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.formatMessage("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.formatMessage("error", message, ...args);
  }

  request(data: RequestLog): void {
    if (!this.enabled) return;

    const { method, url, body, headers } = data;
    this.formatMessage(
      "request",
      `${method} ${url}`,
      { body, headers }
    );
  }

  response(data: ResponseLog): void {
    if (!this.enabled) return;

    const { url, status, statusText, data: responseData, error } = data;
    const level = status >= 400 ? "error" : "response" as LogLevel;

    this.formatMessage(
      level,
      `${status} ${statusText} - ${url}`,
      { data: responseData, error }
    );
  }

  storeUpdate(storeName: string, action: string, data?: unknown): void {
    if (!this.enabled) return;

    this.formatMessage(
      "info",
      `Store Update: ${storeName}.${action}`,
      data
    );
  }

  componentMount(componentName: string, props?: unknown): void {
    if (!this.enabled) return;

    this.formatMessage(
      "info",
      `Component Mounted: ${componentName}`,
      props
    );
  }

  componentAction(componentName: string, action: string, data?: unknown): void {
    if (!this.enabled) return;

    this.formatMessage(
      "info",
      `Component Action: ${componentName}.${action}`,
      data
    );
  }
}

export function createDebugLogger(prefix: string): DebugLogger {
  return new DebugLogger(prefix);
}

// Enable debug mode at runtime
export function enableDebug(): void {
  if (browser) {
    try {
      localStorage.setItem("debug", "true");
    } catch (e) {
      // ignore storage errors
    }
  }
}

// Disable debug mode at runtime
export function disableDebug(): void {
  if (browser) {
    try {
      localStorage.removeItem("debug");
    } catch (e) {
      // ignore storage errors
    }
  }
}

// Check if debug is enabled
export function isDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}
