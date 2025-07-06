import Pino, { Logger, LoggerOptions } from 'pino';

// Define base Pino logger options (log level, custom level format)
export const loggerOptions: LoggerOptions = {
  level: 'info',
  formatters: {
    level(label) {
      return { level: label }; // Ensures log levels are part of the JSON output
    },
  },
};

// Create and export a reusable Pino logger instance
export const logger: Logger = Pino(loggerOptions);
