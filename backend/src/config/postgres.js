const { Pool } = require('pg');
const winston = require('winston');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'knowledge_base',
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    winston.info('Successfully connected to PostgreSQL');
    client.release();
    return true;
  } catch (error) {
    winston.error('Error connecting to PostgreSQL:', error.message);
    throw error;
  }
};

// Function to execute a query
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    winston.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    winston.error('Error executing query:', { text, error: error.message });
    throw error;
  }
};

// Function to get a client from the pool for transactions
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Set a timeout of 5 seconds
  const timeout = setTimeout(() => {
    winston.error('A client has been checked out for more than 5 seconds!');
    winston.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args[0];
    return query.apply(client, args);
  };

  client.release = () => {
    // Clear the timeout
    clearTimeout(timeout);
    // Reset the query method
    client.query = query;
    // Release the client back to the pool
    release.apply(client);
  };

  return client;
};

module.exports = {
  query,
  getClient,
  testConnection,
  pool,
};
