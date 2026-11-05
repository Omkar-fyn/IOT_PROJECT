type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, context ? JSON.stringify(context) : '');
  },
  warn: (message: string, context?: Record<string, any>) => {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, context ? JSON.stringify(context) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`, error?.stack || error || '');
  },
  debug: (message: string, context?: Record<string, any>) => {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.debug(`[${getTimestamp()}] [DEBUG] ${message}`, context ? JSON.stringify(context) : '');
    }
  }
};

