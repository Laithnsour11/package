import { Router } from 'express';
import { sequelize } from '../config/sequelize.js';
import logger from '../config/logger.js';

const router = Router();

// Test database connection
router.get('/test-connection', async (req, res) => {
  try {
    await sequelize.authenticate();
    logger.info('Connection to PostgreSQL has been established successfully.');
    res.status(200).json({ 
      success: true, 
      message: 'Successfully connected to PostgreSQL database',
      database: sequelize.config.database,
      host: sequelize.config.host,
      port: sequelize.config.port
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to the database',
      error: error.message 
    });
  }
});

export default router;
