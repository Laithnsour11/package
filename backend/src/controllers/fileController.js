import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';
import { generateSimpleEmbedding } from '../utils/embeddings.js';
import { cleanupUploads } from '../utils/fileUpload.js';
import Document from '../models/PostgresDocument.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Upload a file
// @route   POST /api/files/upload
// @access  Private
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Read the uploaded file
    const fileContent = await fs.readFile(req.file.path, 'utf8');
    
    // Generate embedding from file content
    const embedding = generateSimpleEmbedding(fileContent);
    
    // Create document in database
    const document = await Document.create({
      title: req.file.originalname,
      content: fileContent,
      embedding: JSON.stringify(generateSimpleEmbedding(fileContent)),
      source: 'file_upload',
      file_type: path.extname(req.file.originalname).slice(1),
      size: req.file.size,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      created_by: req.user?.id || 'system',
      metadata: JSON.stringify({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }),
    });

    // Clean up the uploaded file
    await cleanupUploads(req.file.path);

    logger.info(`File uploaded successfully: ${req.file.originalname}`);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: {
        id: document._id,
        title: document.title,
        metadata: document.metadata,
      },
    });
  } catch (error) {
    // Clean up the uploaded file in case of error
    if (req.file?.path) {
      await cleanupUploads(req.file.path);
    }
    next(error);
  }
};

// @desc    Get file content
// @route   GET /api/files/:id
// @access  Private
const getFile = async (req, res, next) => {
  try {
    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Parse metadata if it's a string
    let metadata = {};
    try {
      metadata = typeof document.metadata === 'string' 
        ? JSON.parse(document.metadata) 
        : document.metadata || {};
    } catch (e) {
      logger.warn(`Error parsing metadata for document ${document.id}: ${e.message}`);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        content: document.content,
        source: document.source,
        file_type: document.file_type,
        size: document.size,
        metadata,
        created_at: document.createdAt,
        updated_at: document.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`Error getting file: ${error.message}`, { error });
    next(error);
  }
};

export { uploadFile, getFile };
