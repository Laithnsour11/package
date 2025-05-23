// api/index.js
import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Set the NODE_ENV to production if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the main server file and database connection
import app from '../src/server.js';
import { sequelize } from '../src/config/sequelize.js';
import logger from '../src/config/logger.js';

// Track if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

// Track database connection status
let isDatabaseConnected = false;
let lastConnectionAttempt = 0;
const CONNECTION_RETRY_DELAY = 5000; // 5 seconds

/**
 * Ensure database connection is established
 */
async function ensureDatabaseConnection() {
  const now = Date.now();
  
  // If we have a recent successful connection, return early
  if (isDatabaseConnected && (now - lastConnectionAttempt) < (CONNECTION_RETRY_DELAY * 2)) {
    return true;
  }
  
  try {
    // Test the connection
    await sequelize.authenticate();
    
    // If this is the first connection or we were previously disconnected
    if (!isDatabaseConnected) {
      logger.info('Database connection established');
      isDatabaseConnected = true;
    }
    
    lastConnectionAttempt = now;
    return true;
  } catch (error) {
    isDatabaseConnected = false;
    logger.error('Database connection error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // In production, we might want to continue running even if DB is down
    // But log the error and let the request continue
    return false;
  }
}

// Export the server for Vercel with database connection handling
export default async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  const startTime = Date.now();
  
  // Log incoming request
  logger.info(`[${requestId}] ${req.method} ${req.url}`, {
    headers: req.headers,
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  
  try {
    // Ensure database connection is established
    const dbConnected = await ensureDatabaseConnection();
    
    if (!dbConnected) {
      logger.warn(`[${requestId}] Database connection not available`);
      // Don't fail the request, let the route handlers handle database errors
    }
    
    // Add request ID and timing to the request object
    req.requestId = requestId;
    
    // Forward the request to the Express app
    const response = await new Promise((resolve) => {
      let responseSent = false;
      
      // Create a response interceptor
      const originalSend = res.send;
      res.send = function (body) {
        if (!responseSent) {
          responseSent = true;
          const responseTime = Date.now() - startTime;
          logger.info(`[${requestId}] ${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`);
          
          // Restore original send function
          res.send = originalSend;
          return originalSend.call(this, body);
        }
        return originalSend.call(this, body);
      };
      
      // Handle errors
      res.on('finish', () => {
        if (!responseSent) {
          responseSent = true;
          const responseTime = Date.now() - startTime;
          logger.info(`[${requestId}] ${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`);
        }
      });
      
      // Handle uncaught errors
      const errorHandler = (err) => {
        if (!responseSent) {
          responseSent = true;
          const responseTime = Date.now() - startTime;
          logger.error(`[${requestId}] Unhandled error in ${req.method} ${req.url} - ${responseTime}ms`, {
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
          });
          
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              error: 'Internal Server Error',
              requestId,
              timestamp: new Date().toISOString()
            });
          }
        }
      };
      
      // Set up error handlers
      req.on('error', errorHandler);
      res.on('error', errorHandler);
      
      // Process the request
      app(req, res, (err) => {
        if (err) {
          errorHandler(err);
        } else if (!responseSent) {
          responseSent = true;
          const responseTime = Date.now() - startTime;
          logger.warn(`[${requestId}] No response sent for ${req.method} ${req.url} - ${responseTime}ms`);
          res.status(404).json({
            success: false,
            error: 'Not Found',
            message: `Route ${req.method} ${req.url} not found`,
            requestId
          });
        }
      });
    });
    
    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(`[${requestId}] Unhandled exception in request handler - ${responseTime}ms`, {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        requestId,
        timestamp: new Date().toISOString()
      });
    }
  }
};
