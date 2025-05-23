import { promises as fs } from 'fs';
import path from 'path';
import logger from '../config/logger.js';

const directoriesToEnsure = [
  'uploads',
  // 'logs' // Removed 'logs' as logger.js handles console logging for Vercel
];

async function ensureDirectoriesExist() {
  if (process.env.VERCEL === '1') {
    logger.info('Running on Vercel, skipping local directory creation for uploads. Ensure UPLOAD_DIR is configured for cloud storage or /tmp if needed.');
    return; // Skip directory creation on Vercel
  }

  try {
    for (const dir of directoriesToEnsure) {
      // Only attempt to create 'uploads' locally. 'logs' is handled by logger.js or console.
      if (dir === 'uploads') { // Or any other dirs needed for local dev but not Vercel
         try {
           await fs.mkdir(dir, { recursive: true });
           logger.info(`Ensured local directory exists: ${dir}`);
         } catch (error) {
           if (error.code !== 'EEXIST') {
             throw error;
           }
         }
      }
    }
  } catch (error) {
    logger.error(`Error ensuring local directories exist: ${error.message}`);
    // Decide if to throw or not based on local dev needs
    // For now, let's not throw to avoid breaking local startup if dir exists
  }
}

export default ensureDirectoriesExist;
