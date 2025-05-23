import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import logger from '../config/logger.js';
import Document from '../models/PostgresDocument.js';
import { generateSimpleEmbedding, cosineSimilarity } from '../utils/embeddings.js';

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

    const document = await Document.create({
      title,
      content,
      embedding: JSON.stringify(embedding), // Store as JSON string
      source: 'text_input',
      created_by: req.user?.id || 'system', // In a real app, get from auth
      tags: tags.join(','), // Store tags as comma-separated string or use a separate table
      metadata: JSON.stringify({
        // Add any additional metadata here
      })
    });

    logger.info(`Document created: ${document._id}`);
    
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
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Generate embedding for the query
    const queryEmbedding = generateSimpleEmbedding(query);

    // In a real app, you would use MongoDB Atlas Vector Search here
    const allDocuments = await Document.find({});
    
    // Calculate similarity scores
    const results = allDocuments.map(doc => ({
      document: doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // Sort by similarity and limit results
    const sortedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    res.status(StatusCodes.OK).json({
      success: true,
      count: sortedResults.length,
      data: sortedResults.map(r => ({
        ...r.document.toObject(),
        similarity: r.similarity
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions moved to src/utils/embeddings.js

export { createDocument, searchDocuments };
