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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Connect to PostgreSQL database and initialize extensions
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection has been established successfully.');
    
    // Create required extensions
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "vector"');
    logger.info('PostgreSQL extensions initialized');
    
    // Sync all models - force true in development to recreate tables
    const syncOptions = process.env.NODE_ENV === 'development' 
      ? { force: true } // This will drop and recreate tables
      : { alter: true }; // In production, use alter to avoid data loss
      
    await sequelize.sync(syncOptions);
    logger.info(`Database synchronized with options: ${JSON.stringify(syncOptions)}`);
  } catch (error) {
    logger.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

// Initialize the database in all environments
(async () => {
  try {
    await initializeDatabase();
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
})();

// Ensure required directories exist
import ensureDirectoriesExist from './utils/initDirectories.js';

// Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    version: process.env.npm_package_version
  });
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

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/test', testDbRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
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
