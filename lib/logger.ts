// lib/logger.ts

/**
 * Simple logger utility for production and development environments
 */
class Logger {
    private isDev: boolean;
  
    constructor() {
      this.isDev = process.env.NODE_ENV !== 'production';
    }
  
    /**
     * Log informational message
     * @param context Context of the log
     * @param message Message to log
     * @param data Optional data to include
     */
    info(context: string, message: string, data?: any): void {
      this.logMessage('INFO', context, message, data);
    }
  
    /**
     * Log warning message
     * @param context Context of the log
     * @param message Message to log
     * @param data Optional data to include
     */
    warn(context: string, message: string, data?: any): void {
      this.logMessage('WARN', context, message, data);
    }
  
    /**
     * Log error message
     * @param context Context of the log
     * @param error Error to log
     * @param data Optional data to include
     */
    error(context: string, error: unknown, data?: any): void {
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
        
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logMessage('ERROR', context, errorMessage, {
        ...(data || {}),
        stack: errorStack,
      });
      
      // In development, display the full error object
      if (this.isDev && error instanceof Error) {
        console.error(error);
      }
    }
  
    /**
     * Format and log message with consistent structure
     */
    private logMessage(level: string, context: string, message: string, data?: any): void {
      const timestamp = new Date().toISOString();
      const formattedContext = `[${context}]`;
      
      // In development, include more details
      if (this.isDev) {
        console[level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](
          `${timestamp} ${level} ${formattedContext} ${message}`,
          data ? data : ''
        );
      } else {
        // In production, log more concisely
        console[level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](
          `${level} ${formattedContext} ${message}`
        );
      }
    }
  }
  
  export const logger = new Logger();