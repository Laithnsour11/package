// api/index.js
import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Set the NODE_ENV to production if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the main server file
import app from '../src/server.js';

// Export the server for Vercel
export default app;
