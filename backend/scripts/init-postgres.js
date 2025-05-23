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

// PostgreSQL connection configuration
const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'knowledge_base',
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// Set statement_timeout to avoid long-running queries
dbConfig.statement_timeout = 30000; // 30 seconds

// Create a new pool
const pool = new Pool(dbConfig);

// Database name
const dbName = process.env.PGDATABASE || 'knowledge_base';

// SQL commands to set up the database
const setupSQL = [
  // Create extension
  'CREATE EXTENSION IF NOT EXISTS vector',
  
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  
  // Create documents table with vector support
  `CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    source VARCHAR(50) NOT NULL CHECK (source IN ('file_upload', 'text_input', 'video')),
    file_type VARCHAR(50),
    size BIGINT,
    original_name TEXT,
    mime_type VARCHAR(100),
    video_url TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  
  // Create tags table
  `CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  
  // Create document_tags junction table
  `CREATE TABLE IF NOT EXISTS document_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (document_id, tag_id)
  )`,
  
  // Create indexes
  'CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source)',
  'CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id)',
  'CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id)'
  // Note: The ivfflat index is commented out as it might require additional setup
  // 'CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)'
];

async function runSQLCommands() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const sql of setupSQL) {
      logger.info(`Executing: ${sql.split('\n')[0]}...`);
      await client.query(sql);
    }
    
    await client.query('COMMIT');
    logger.info('✅ Database setup completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the database initialization
runSQLCommands()
  .then(() => {
    logger.info('✅ Database initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Database initialization failed:', error);
    process.exit(1);
  });
