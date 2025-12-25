/**
 * Logger sécurisé pour production
 *
 * Usage:
 *   import { logger, geminiLogger } from '@/lib/logger';
 *   logger.debug('Message debug');
 *   logger.info('Message info');
 *   logger.warn('Message warning');
 *   logger.error('Message error');
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabledLevels: LogLevel[];
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

// Détection environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration par défaut selon environnement
const getDefaultConfig = (): LoggerConfig => {
  if (isProduction) {
    // Production: seulement warn et error
    return {
      enabledLevels: ['warn', 'error'],
      prefix: '',
      enableTimestamp: true,
      enableColors: false,
    };
  } else if (isTest) {
    // Test: pas de logs
    return {
      enabledLevels: [],
      prefix: '',
      enableTimestamp: false,
      enableColors: false,
    };
  } else {
    // Development: tous les niveaux
    return {
      enabledLevels: ['debug', 'info', 'warn', 'error'],
      prefix: '',
      enableTimestamp: true,
      enableColors: true,
    };
  }
};

// Codes couleur ANSI
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Crée un logger avec configuration custom
 */
function createLogger(customConfig?: Partial<LoggerConfig>) {
  const config: LoggerConfig = {
    ...getDefaultConfig(),
    ...customConfig,
  };

  const shouldLog = (level: LogLevel): boolean => {
    return config.enabledLevels.includes(level);
  };

  const formatMessage = (level: LogLevel, args: unknown[]): string => {
    const parts: string[] = [];

    // Timestamp
    if (config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(config.enableColors ? `${COLORS.gray}${timestamp}${COLORS.reset}` : timestamp);
    }

    // Level
    const levelStr = `[${level.toUpperCase()}]`;
    if (config.enableColors) {
      const color =
        level === 'error' ? COLORS.red :
        level === 'warn' ? COLORS.yellow :
        level === 'info' ? COLORS.blue :
        COLORS.gray;
      parts.push(`${color}${levelStr}${COLORS.reset}`);
    } else {
      parts.push(levelStr);
    }

    // Prefix
    if (config.prefix) {
      parts.push(config.prefix);
    }

    return parts.join(' ');
  };

  const sanitizeArgs = (args: unknown[]): unknown[] => {
    return args.map(arg => {
      // Si c'est un objet, vérifier qu'il ne contient pas de secrets
      if (typeof arg === 'object' && arg !== null) {
        const obj = arg as Record<string, unknown>;
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key'];

        const hasSensitiveKey = Object.keys(obj).some(key =>
          sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
        );

        if (hasSensitiveKey) {
          return '[OBJECT WITH SENSITIVE DATA - REDACTED]';
        }
      }

      // Si c'est une string qui ressemble à une clé API/token
      if (typeof arg === 'string') {
        // Détection patterns de secrets
        const secretPatterns = [
          /^AIza[0-9A-Za-z_-]{35}$/,  // Google API Key
          /^sk-[0-9A-Za-z]{48}$/,      // OpenAI API Key
          /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, // JWT
        ];

        if (secretPatterns.some(pattern => pattern.test(arg))) {
          return '[SECRET REDACTED]';
        }
      }

      return arg;
    });
  };

  return {
    debug: (...args: unknown[]) => {
      if (!shouldLog('debug')) return;
      const sanitized = sanitizeArgs(args);
      console.log(formatMessage('debug', sanitized), ...sanitized);
    },

    info: (...args: unknown[]) => {
      if (!shouldLog('info')) return;
      const sanitized = sanitizeArgs(args);
      console.info(formatMessage('info', sanitized), ...sanitized);
    },

    warn: (...args: unknown[]) => {
      if (!shouldLog('warn')) return;
      const sanitized = sanitizeArgs(args);
      console.warn(formatMessage('warn', sanitized), ...sanitized);
    },

    error: (...args: unknown[]) => {
      if (!shouldLog('error')) return;
      const sanitized = sanitizeArgs(args);
      console.error(formatMessage('error', sanitized), ...sanitized);
    },
  };
}

// Loggers par défaut exportés
export const logger = createLogger();

// Loggers spécialisés avec préfixes
export const geminiLogger = createLogger({
  prefix: '[GEMINI]',
});

export const exerciseLogger = createLogger({
  prefix: '[EXERCISE]',
});

export const authLogger = createLogger({
  prefix: '[AUTH]',
});

export const storageLogger = createLogger({
  prefix: '[STORAGE]',
});

// Export du créateur pour loggers custom
export { createLogger };

// Types exports
export type { LogLevel, LoggerConfig };

/**
 * EXEMPLES D'USAGE
 *
 * // Basic logging
 * logger.debug('Debugging info');
 * logger.info('User logged in', { userId: '123' });
 * logger.warn('Low disk space');
 * logger.error('Failed to connect', error);
 *
 * // Specialized loggers
 * geminiLogger.debug('API configured:', !!process.env.GEMINI_API_KEY);
 * exerciseLogger.info('Creating exercise', { title: 'Traction' });
 *
 * // Custom logger
 * const dbLogger = createLogger({ prefix: '[DATABASE]' });
 * dbLogger.debug('Query executed', { duration: '45ms' });
 *
 * // Logger auto-sanitize les secrets
 * logger.debug('API Key:', process.env.GEMINI_API_KEY);
 * // Output: [DEBUG] [GEMINI] API Key: [SECRET REDACTED]
 */
