// Logger utility for error handling and debugging

interface LogOptions {
  context: string;
  data?: unknown;
}

/**
 * Production-safe logging utility
 * Only logs in development mode
 */
export const logger = {
  error: (message: string, options?: LogOptions) => {
    if (import.meta.env.DEV) {
      const prefix = options?.context ? `[${options.context}]` : '';
      console.error(`${prefix} ${message}`, options?.data ?? '');
    }
    // TODO: Send to error tracking service in production (Sentry, etc.)
  },

  warn: (message: string, options?: LogOptions) => {
    if (import.meta.env.DEV) {
      const prefix = options?.context ? `[${options.context}]` : '';
      console.warn(`${prefix} ${message}`, options?.data ?? '');
    }
  },

  info: (message: string, options?: LogOptions) => {
    if (import.meta.env.DEV) {
      const prefix = options?.context ? `[${options.context}]` : '';
      console.info(`${prefix} ${message}`, options?.data ?? '');
    }
  },

  debug: (message: string, options?: LogOptions) => {
    if (import.meta.env.DEV) {
      const prefix = options?.context ? `[${options.context}]` : '';
      console.debug(`${prefix} ${message}`, options?.data ?? '');
    }
  },
};

/**
 * Log error with context - convenience wrapper
 */
export function logError(context: string, error: unknown): void {
  logger.error('An error occurred', { context, data: error });
}
