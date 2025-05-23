import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log format
const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if it exists
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

// Ensure log directory exists (synchronously)
const ensureLogsDir = () => {
  const logDir = 'logs';
  try {
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
};

// Create the logger
const createLogger = () => {
  ensureLogsDir();
  
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      json()
    ),
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize(),
          logFormat
        )
      })
    ]
  });

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }));
  }

  return logger;
};

// Create and export the logger instance
const logger = createLogger();

export default logger;
