import { sequelize } from '../src/config/sequelize.js';
import logger from '../src/config/logger.js';

async function initializeDatabase() {
  try {
    // Create the database if it doesn't exist
    const databaseName = process.env.PGDATABASE || 'knowledge_base';
    const queryInterface = sequelize.getQueryInterface();
    
    // Create extension if it doesn't exist
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "vector"');
    
    logger.info('Database extensions created successfully');
    
    // Sync all models
    await sequelize.sync({ force: true });
    logger.info('Database synchronized successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
