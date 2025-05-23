const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const documentController = require('../controllers/documentController.new');

// Input validation middleware
const validateDocumentInput = [
  body('title', 'Title is required').not().isEmpty().trim(),
  body('content', 'Content is required').not().isEmpty(),
  body('tags').optional().isArray(),
  body('metadata').optional().isObject()
];

const validateSearchInput = [
  body('query', 'Search query is required').not().isEmpty().trim(),
  body('limit', 'Limit must be a positive integer').optional().isInt({ min: 1 }),
  body('threshold', 'Threshold must be between 0 and 1').optional().isFloat({ min: 0, max: 1 })
];

// @route   POST /api/documents
// @desc    Create a new document
// @access  Private
router.post('/', validateDocumentInput, documentController.createDocument);

// @route   POST /api/documents/search
// @desc    Search documents using semantic search
// @access  Public
router.post('/search', validateSearchInput, documentController.searchDocuments);

// @route   GET /api/documents/:id
// @desc    Get a single document by ID
// @access  Public
router.get(
  '/:id',
  param('id', 'Valid document ID is required').isUUID(),
  documentController.getDocument
);

// @route   PUT /api/documents/:id
// @desc    Update a document
// @access  Private
router.put(
  '/:id',
  [
    param('id', 'Valid document ID is required').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('content').optional().notEmpty(),
    body('tags').optional().isArray(),
    body('metadata').optional().isObject()
  ],
  documentController.updateDocument
);

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete(
  '/:id',
  param('id', 'Valid document ID is required').isUUID(),
  documentController.deleteDocument
);

module.exports = router;
