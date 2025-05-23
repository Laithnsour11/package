require('dotenv').config();
const { Pool } = require('pg');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// PostgreSQL connection configuration
const pgConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: 'postgres', // Connect to default database
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Database name
const dbName = process.env.PGDATABASE || 'knowledge_base';

async function resetDatabase() {
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    logger.info(`Dropping database: ${dbName}`);
    
    // Disconnect all active connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid();
    `);
    
    // Drop the database
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    logger.info(`Database ${dbName} dropped successfully`);
    
    // Recreate the database
    await client.query(`CREATE DATABASE ${dbName}`);
    logger.info(`Database ${dbName} created successfully`);
    
    // Reconnect to the new database to create extensions
    const newPool = new Pool({
      ...pgConfig,
      database: dbName
    });
    
    const newClient = await newPool.connect();
    try {
      await newClient.query('CREATE EXTENSION IF NOT EXISTS vector');
      logger.info('pgvector extension created successfully');
    } finally {
      newClient.release();
      await newPool.end();
    }
    
    logger.info('✅ Database reset completed');
    
  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('❌ Database reset failed:', error);
    process.exit(1);
  });
