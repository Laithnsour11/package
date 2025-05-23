import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Define log format for console
const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // Add metadata if it exists
  if (meta && Object.keys(meta).length > 0) {
    // Skip error stack traces in production for cleaner logs
    if (process.env.NODE_ENV !== 'development' && meta.stack) {
      delete meta.stack;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
  }
  
  return log;
});

// Create the logger with console transport only (for serverless compatibility)
const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  // In Vercel, we want to use structured logs for better querying
  const format = isVercel 
    ? combine(
        timestamp(),
        json()
      )
    : combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        isProduction ? json() : colorize(),
        consoleFormat
      );

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format,
    defaultMeta: {
      service: 'backend-api',
      environment: process.env.NODE_ENV || 'development',
      ...(isVercel && {
        // Add Vercel-specific metadata
        vercel: {
          region: process.env.VERCEL_REGION || 'unknown',
          environment: process.env.VERCEL_ENV || 'development',
          url: process.env.VERCEL_URL || 'local'
        }
      })
    },
    transports: [
      new winston.transports.Console({
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          isProduction ? json() : colorize(),
          consoleFormat
        )
      })
    ]
  });

  // Add request ID to logs if available
  logger.addContext = (req) => {
    return {
      requestId: req.id || 'unknown',
      path: req.path,
      method: req.method,
      ...(req.user && { userId: req.user.id })
    };
  };

  // Simple wrapper for error logging
  logger.errorWithContext = (message, error, context = {}) => {
    const logData = {
      ...context,
      stack: error?.stack,
      error: {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        ...(error?.response && { response: error.response })
      }
    };
    
    // Remove undefined values
    Object.keys(logData).forEach(key => 
      logData[key] === undefined && delete logData[key]
    );
    
    logger.error(message, logData);
  };

  return logger;
};

// Create and export the logger instance
const logger = createLogger();

export default logger;
