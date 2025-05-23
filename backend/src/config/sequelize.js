import { Sequelize } from 'sequelize';
import logger from './logger.js';
import 'dotenv/config';

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(
  process.env.PGDATABASE || 'knowledge_base',
  process.env.PGUSER || 'postgres',
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
  }
);

// Import models after sequelize is initialized
import initUserModel from '../models/PostgresUser.js';
import initDocumentModel from '../models/PostgresDocument.js';

// Initialize models with sequelize instance
const User = initUserModel(sequelize);
const Document = initDocumentModel(sequelize);

// Set up associations if needed
if (User.associate) {
  User.associate({ Document });
}

if (Document.associate) {
  Document.associate({ User });
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL Connection has been established successfully.');
    return true;
  } catch (error) {
    logger.error('Unable to connect to the PostgreSQL database:', error);
    throw error;
  }
};

// Sync all models
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info('All models were synchronized successfully.');
  } catch (error) {
    logger.error('Error synchronizing models:', error);
  }
};

// Export the Sequelize instance and models
export { sequelize, testConnection, syncModels, User, Document, Sequelize };
