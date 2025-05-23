import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
const uploadPath = (process.env.VERCEL === '1' && !process.env.UPLOAD_DIR)
  ? path.join('/tmp', 'uploads') // Use /tmp/uploads on Vercel if UPLOAD_DIR isn't set for cloud
  : uploadDirName;

// Check if we should attempt to create the directory
const shouldCreateDirectory = process.env.VERCEL !== '1' || 
                              (process.env.VERCEL === '1' && uploadPath.startsWith('/tmp'));

if (shouldCreateDirectory) {
  if (!fs.existsSync(uploadPath)) {
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      logger.info(`Ensured upload directory exists: ${uploadPath}`);
    } catch (error) {
      logger.error(`Failed to create upload directory ${uploadPath}: ${error.message}`);
      // Depending on strategy, might want to throw here if local dir creation fails
      // For now, let's not throw, to allow server to start if possible
    }
  }
} else if (process.env.VERCEL === '1' && !uploadPath.startsWith('/tmp')) {
    logger.warn(`On Vercel, UPLOAD_DIR ('${uploadDirName}') is not /tmp. File uploads to this path will likely fail. Configure UPLOAD_DIR to a cloud service or ensure it points to /tmp.`);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, DOC, DOCX, and MD files are allowed.'), false);
  }
};

// Initialize multer with configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
});

// Middleware to handle file upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    logger.error(`Multer upload error: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    // An unknown error occurred
    logger.error(`File upload error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during file upload',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
  // No error, proceed to next middleware
  next();
};

// Function to clean up uploaded files
const cleanupUploads = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Error cleaning up file ${filePath}: ${error.message}`);
  }
};

export {
  upload,
  handleUploadErrors,
  cleanupUploads,
  uploadPath
};
