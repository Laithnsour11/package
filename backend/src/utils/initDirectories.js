import { promises as fs } from 'fs';
import path from 'path';
import logger from '../config/logger.js';

const directories = [
  'uploads',
  'logs'
];

async function ensureDirectoriesExist() {
  try {
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Ensured directory exists: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }
    }
  } catch (error) {
    logger.error(`Error ensuring directories exist: ${error.message}`);
    throw error;
  }
}

export default ensureDirectoriesExist;
