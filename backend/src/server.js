import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import documentRoutes from './routes/documentRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import testDbRoutes from './routes/testDb.js';
import logger from './config/logger.js';
import { sequelize } from './config/sequelize.js';

// Track server startup time
const serverStartTime = new Date();
let isDatabaseInitialized = false;  // Track database initialization state

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Add request ID to each request
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 10);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      requestId: req.id,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
  });
  
  next();
});

// Connect to PostgreSQL database and initialize extensions
async function initializeDatabase() {
  const startTime = Date.now();
  
  try {
    logger.info('Initializing database connection...');
    
    // Test connection with retry logic
    let connected = false;
    let lastError;
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await sequelize.authenticate();
        connected = true;
        break;
      } catch (error) {
        lastError = error;
        const delay = 1000 * (i + 1);
        logger.warn(`Database connection attempt ${i + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!connected) {
      throw lastError || new Error('Failed to connect to database after multiple attempts');
    }
    
    logger.info('PostgreSQL connection has been established successfully.');
    
    // Create required extensions
    logger.info('Initializing PostgreSQL extensions...');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "vector"');
    logger.info('PostgreSQL extensions initialized');
    
    // Sync all models - use safe options in production
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { force: false, alter: true } // Safer options for development
      : { alter: true }; // In production, only use alter
      
    logger.info(`Synchronizing database with options: ${JSON.stringify(syncOptions)}`);
    await sequelize.sync(syncOptions);
    
    const initTime = Date.now() - startTime;
    logger.info(`Database initialization completed in ${initTime}ms`);
    
    return true;
  } catch (error) {
    const errorMessage = 'Unable to initialize database';
    logger.error(errorMessage, { 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      duration: Date.now() - startTime
    });
    
    // Don't exit in serverless environment, let the error be handled by the platform
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
    
    throw error;
  }
}

// Database initialization promise
let databaseInitialization = null;

// Initialize database connection
const ensureDatabaseInitialized = async () => {
  if (isDatabaseInitialized) return true;
  
  if (!databaseInitialization) {
    databaseInitialization = (async () => {
      try {
        await initializeDatabase();
        isDatabaseInitialized = true;
        logger.info('Database connection established successfully');
        return true;
      } catch (error) {
        isDatabaseInitialized = false;
        databaseInitialization = null;
        logger.errorWithContext('Database initialization failed', error, {
          service: 'database',
          operation: 'initialize'
        });
        throw error;
      }
    })();
  }
  
  return databaseInitialization;
};

// Middleware to ensure database is available
const ensureDatabase = async (req, res, next) => {
  try {
    await ensureDatabaseInitialized();
    next();
  } catch (error) {
    const errorId = Math.random().toString(36).substring(2, 10);
    const errorResponse = {
      success: false,
      error: 'Service Unavailable',
      message: 'Database connection failed',
      errorId,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    };

    // Log the error with context
    logger.errorWithContext(
      'Database connection error in request handler',
      error,
      {
        requestId: req.id,
        path: req.path,
        method: req.method,
        errorId
      }
    );

    res.status(503).json(errorResponse);
  }
};

// Initialize database on startup
if (process.env.NODE_ENV !== 'test') {
  ensureDatabaseInitialized().catch(error => {
    logger.error('Fatal error during database initialization', error);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  });
}

// Ensure required directories exist
import ensureDirectoriesExist from './utils/initDirectories.js';

/**
 * Health check endpoint with detailed system and database information
 * This endpoint provides comprehensive information about the server and database status
 * It's designed to be used by monitoring systems and for debugging purposes
 */
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    serverStartTime: serverStartTime.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    database: {
      status: 'unknown',
      connection: {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        database: process.env.PGDATABASE || 'knowledge_base',
        user: process.env.PGUSER || 'postgres',
        ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'
      },
      details: {},
      stats: {}
    },
    system: {
      arch: process.arch,
      platform: process.platform,
      release: process.release?.name || 'unknown',
      cpus: require('os').cpus().length,
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
      loadavg: require('os').loadavg()
    },
    request: {
      id: req.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }
  };
  
  try {
    // Check database connection
    const dbStartTime = Date.now();
    await sequelize.authenticate();
    const dbPingTime = Date.now() - dbStartTime;
    
    healthCheck.database.status = 'connected';
    healthCheck.database.pingTimeMs = dbPingTime;
    
    // Get database version and stats
    try {
      const [dbVersion] = await sequelize.query('SELECT version()');
      const [dbStats] = await sequelize.query(`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT pg_database_size(current_database())) as db_size_bytes,
          (SELECT now() - pg_postmaster_start_time()) as uptime
      `);
      
      healthCheck.database.details = {
        version: dbVersion[0]?.version || 'unknown',
        activeConnections: dbStats[0]?.active_connections || 'unknown',
        maxConnections: dbStats[0]?.max_connections || 'unknown',
        databaseSize: dbStats[0]?.db_size_bytes || 'unknown',
        uptime: dbStats[0]?.uptime || 'unknown'
      };
      
      // Get table counts if database is connected
      try {
        const [tables] = await sequelize.query(`
          SELECT 
            table_name,
            pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
            (SELECT reltuples FROM pg_class WHERE oid = quote_ident(table_name)::regclass) as row_count
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
        `);
        
        healthCheck.database.stats.tables = tables;
      } catch (tableError) {
        healthCheck.database.stats.tablesError = tableError.message;
      }
    } catch (statsError) {
      healthCheck.database.detailsError = statsError.message;
    }
    
    // Calculate response time
    healthCheck.responseTimeMs = Date.now() - startTime;
    
    // Set appropriate status code based on database status
    const statusCode = healthCheck.database.status === 'connected' ? 200 : 503;
    
    // Log the health check
    logger.info(`Health check completed in ${healthCheck.responseTimeMs}ms`, {
      status: healthCheck.status,
      dbStatus: healthCheck.database.status,
      requestId: req.id
    });
    
    return res.status(statusCode).json(healthCheck);
  } catch (error) {
    healthCheck.status = 'error';
    healthCheck.database.status = 'error';
    healthCheck.error = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      name: error.name || 'Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    // Log the error
    logger.error('Health check failed', {
      error: error.message,
      code: error.code,
      requestId: req.id,
      stack: error.stack
    });
    
    return res.status(503).json(healthCheck);
  }
});

ensureDirectoriesExist().catch(err => {
  logger.error('Failed to initialize directories:', err);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/test', testDbRoutes);

// Redirect root and /health to the comprehensive health check
app.get(['/', '/health'], (req, res) => {
  res.redirect('/api/health');
});

// Serve uploaded files statically in development
if (process.env.NODE_ENV === 'development') {
  app.use('/uploads', express.static('uploads'));
}

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default server;
