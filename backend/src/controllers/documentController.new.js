const { StatusCodes } = require('http-status-codes');
const { validationResult } = require('express-validator');
const DocumentRepository = require('../repositories/documentRepository');
const logger = require('../config/logger');

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { title, content, tags = [] } = req.body;
    
    // In a real app, you would generate embeddings using an ML service
    const embedding = generateSimpleEmbedding(content);

    const document = await DocumentRepository.create({
      title,
      content,
      embedding,
      metadata: {
        source: 'text_input',
        tags,
        created_by: req.user?.id || 'system' // In a real app, get from auth
      }
    });

    logger.info(`Document created: ${document.id}`);
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search documents
// @route   POST /api/documents/search
// @access  Public
const searchDocuments = async (req, res, next) => {
  try {
    const { query, limit = 10, threshold = 0.7 } = req.body;

    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Generate embedding for the query
    const queryEmbedding = generateSimpleEmbedding(query);
    
    // Search using Supabase vector similarity
    const results = await DocumentRepository.findByEmbedding(
      queryEmbedding,
      threshold,
      limit
    );

    res.status(StatusCodes.OK).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Public
const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await DocumentRepository.findById(id);
    
    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // If content is being updated, regenerate the embedding
    if (updates.content) {
      updates.embedding = generateSimpleEmbedding(updates.content);
    }
    
    const updatedDoc = await DocumentRepository.update(id, updates);
    
    if (!updatedDoc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    await DocumentRepository.delete(id);
    
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    next(error);
  }
};

// Helper function to generate simple embeddings (for demo purposes)
function generateSimpleEmbedding(text) {
  // This is a simplified version - use a real ML model in production
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(1536).fill(0); // OpenAI embeddings are 1536-dimensional
  
  words.forEach(word => {
    const hash = word.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    for (let i = 0; i < embedding.length; i++) {
      const value = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
      embedding[i] = (embedding[i] + value) / 2;
    }
  });
  
  return embedding;
}

module.exports = {
  createDocument,
  searchDocuments,
  getDocument,
  updateDocument,
  deleteDocument
};
