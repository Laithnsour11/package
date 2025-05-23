import { Router } from 'express';
import { body } from 'express-validator';
import { createDocument, searchDocuments } from '../controllers/documentController.js';

const router = Router();

// @route   POST /api/documents
// @desc    Create a new document
// @access  Private
router.post(
  '/',
  [
    body('title', 'Title is required').not().isEmpty().trim(),
    body('content', 'Content is required').not().isEmpty(),
  ],
  createDocument
);

// @route   POST /api/documents/search
// @desc    Search documents
// @access  Public
router.post(
  '/search',
  [
    body('query', 'Search query is required').not().isEmpty().trim(),
    body('limit', 'Limit must be a positive integer').optional().isInt({ min: 1 })
  ],
  searchDocuments
);

export default router;
