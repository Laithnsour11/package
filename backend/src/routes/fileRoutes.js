import { Router } from 'express';
import { body } from 'express-validator';
import { uploadFile, getFile } from '../controllers/fileController.js';
import { upload, handleUploadErrors } from '../utils/fileUpload.js';

const router = Router();

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post(
  '/upload',
  [
    // Add any validation middleware here
  ],
  upload.single('file'),
  handleUploadErrors,
  uploadFile
);

// @route   GET /api/files/:id
// @desc    Get file content
// @access  Private
router.get(
  '/:id',
  [
    // Add any validation middleware here
  ],
  getFile
);

export default router;
