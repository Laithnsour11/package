import { Pool } from 'pg';
import { config } from 'dotenv';
import winston from 'winston';

// Load environment variables
config();

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

// PostgreSQL connection configuration (connect to default 'postgres' database)
const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: 'postgres', // Connect to default database
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Database name
const dbName = process.env.PGDATABASE || 'knowledge_base';

async function createDatabase() {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  
  try {
    logger.info(`Creating database: ${dbName}`);
    await client.query(`CREATE DATABASE ${dbName}`);
    logger.info(`Database ${dbName} created successfully`);
    
    // Connect to the new database to create extensions
    const newPool = new Pool({
      ...dbConfig,
      database: dbName
    });
    
    const newClient = await newPool.connect();
    try {
      logger.info('Creating pgvector extension');
      await newClient.query('CREATE EXTENSION IF NOT EXISTS vector');
      logger.info('pgvector extension created successfully');
    } finally {
      newClient.release();
      await newPool.end();
    }
    
  } catch (error) {
    if (error.code === '42P04') {
      logger.info(`Database ${dbName} already exists`);
    } else {
      logger.error('Error creating database:', error);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the database creation
createDatabase()
  .then(() => {
    logger.info('✅ Database setup completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Database setup failed:', error);
    process.exit(1);
  });
