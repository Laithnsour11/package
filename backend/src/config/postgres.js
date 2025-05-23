const { Pool } = require('pg');
const winston = require('winston');

// Connection configuration with environment variables
const config = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'knowledge_base',
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  // Connection pool settings optimized for serverless
  max: process.env.NODE_ENV === 'production' ? 2 : 10, // Lower max connections in production for serverless
  min: 1,
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  allowExitOnIdle: true, // Allow process to exit when idle
};

// Initialize PostgreSQL connection pool
const pool = new Pool(config);

// Event listeners for pool
pool.on('connect', () => {
  winston.debug('New client connected to the pool');
});

pool.on('error', (err) => {
  winston.error('Unexpected error on idle client', err);
  // Don't throw here as it would crash the app
});

// Test the connection with retry logic for serverless environments
const testConnection = async (maxRetries = 3, retryDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      winston.info('Successfully connected to PostgreSQL');
      client.release();
      return true;
    } catch (error) {
      lastError = error;
      winston.warn(`Connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  winston.error('All connection attempts failed:', lastError.message);
  throw lastError;
};

// Function to execute a query with timeout and better error handling
const query = async (text, params, timeoutMs = 10000) => {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    
    // Set a statement timeout for this query
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    winston.debug('Executed query', { 
      query: text, 
      duration, 
      rows: res.rowCount,
      params: params ? JSON.stringify(params) : undefined
    });
    
    return res;
  } catch (error) {
    winston.error('Error executing query:', { 
      query: text, 
      error: error.message,
      params: params ? JSON.stringify(params) : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Add more context to the error
    const dbError = new Error(`Database query failed: ${error.message}`);
    dbError.originalError = error;
    dbError.query = text;
    dbError.params = params;
    
    throw dbError;
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
};

// Function to get a client from the pool for transactions
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  const clientId = Math.random().toString(36).substring(2, 8); // For debugging
  
  winston.debug(`Acquired client from pool [${clientId}]`);
  
  // Set a timeout of 30 seconds for transaction clients
  const timeout = setTimeout(() => {
    const errorMessage = `Client [${clientId}] has been checked out for more than 30 seconds!`;
    winston.error(errorMessage);
    winston.error(`Last query: ${client.lastQuery || 'No query executed'}`);
    winston.error(`Client in transaction: ${client.queryCount || 0} queries executed`);
    
    // Log the error to Sentry or other monitoring if available
    if (process.env.SENTRY_DSN) {
      const Sentry = require('@sentry/node');
      Sentry.captureMessage(errorMessage, {
        level: 'error',
        tags: { clientId, queryCount: client.queryCount || 0 }
      });
    }
  }, 5000);

  // Track the number of queries executed on this client
  client.queryCount = 0;
  client.clientId = clientId;
  
  // Monkey patch the query method to keep track of the last query executed
  const originalQuery = client.query;
  client.query = async (...args) => {
    client.lastQuery = args[0];
    client.queryCount = (client.queryCount || 0) + 1;
    
    try {
      winston.debug(`Executing query [${clientId}.${client.queryCount}]`, { 
        query: args[0],
        params: args[1] ? JSON.stringify(args[1]) : undefined
      });
      
      const start = Date.now();
      const result = await originalQuery.apply(client, args);
      const duration = Date.now() - start;
      
      winston.debug(`Query [${clientId}.${client.queryCount}] completed in ${duration}ms`, {
        rowCount: result.rowCount,
        duration
      });
      
      return result;
    } catch (error) {
      winston.error(`Query [${clientId}.${client.queryCount}] failed after ${Date.now() - start}ms`, {
        query: args[0],
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    }
  };

  // Override the release method to ensure proper cleanup
  const originalRelease = client.release;
  client.release = (err) => {
    // Clear the timeout
    clearTimeout(timeout);
    
    // Log client release
    winston.debug(`Releasing client [${clientId}]`, {
      queryCount: client.queryCount,
      error: err ? err.message : undefined
    });
    
    // Reset the client
    client.query = originalQuery;
    client.release = originalRelease;
    
    // If there's an error, log it and destroy the client
    if (err) {
      winston.error('Error in client release - destroying client', {
        clientId,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        lastQuery: client.lastQuery,
        queryCount: client.queryCount
      });
      
      // In case of error, destroy the client to prevent reuse
      client._pool.destroy(client);
      return;
    }
    
    // Otherwise, release back to the pool
    return originalRelease.apply(client, [err]);
  };

  return client;
};

module.exports = {
  query,
  getClient,
  testConnection,
  pool,
};
