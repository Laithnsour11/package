// api/index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();
const upload = multer({ dest: '/tmp/uploads/' });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple in-memory storage for demonstration
// In a production app, you would use a database
const knowledgeBase = {
  documents: [],
  nextId: 1
};

// Helper function to generate simple embeddings
function generateEmbedding(text) {
  // This is a very simplified embedding function
  // In production, you would use a proper embedding service
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Generate a deterministic but unique embedding based on text content
  const embedding = [];
  for (let i = 0; i < 10; i++) {
    // Use the hash to seed a simple PRNG
    const value = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
    embedding.push(value);
  }
  
  return embedding;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vec1, vec2) {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running'
  });
});

// Search endpoint
app.post('/api/search', (req, res) => {
  try {
    const { query, k = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
    
    // Generate embedding for the query
    const queryEmbedding = generateEmbedding(query);
    
    // Search for similar documents
    const results = knowledgeBase.documents.map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      return {
        content: doc.content,
        metadata: doc.metadata,
        similarity,
        source: doc.metadata.source || 'Unknown'
      };
    });
    
    // Sort by similarity (descending) and take top k
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, k);
    
    res.json({
      query,
      results: topResults,
      result_count: topResults.length
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add text endpoint
app.post('/api/add/text', (req, res) => {
  try {
    const { text, title, metadata = {} } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }
    
    // Generate embedding
    const embedding = generateEmbedding(text);
    
    // Create document
    const doc = {
      id: knowledgeBase.nextId++,
      content: text,
      embedding,
      metadata: {
        ...metadata,
        title: title || `Document ${knowledgeBase.nextId - 1}`,
        added_at: new Date().toISOString()
      }
    };
    
    // Add to knowledge base
    knowledgeBase.documents.push(doc);
    
    res.status(201).json({
      success: true,
      message: 'Added text to knowledge base',
      doc_id: doc.id
    });
  } catch (error) {
    console.error('Error in add_text endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add file endpoint
app.post('/api/add/file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Read file content
    const filePath = req.file.path;
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Generate embedding
    const embedding = generateEmbedding(content);
    
    // Create document
    const doc = {
      id: knowledgeBase.nextId++,
      content,
      embedding,
      metadata: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        added_at: new Date().toISOString(),
        source: req.file.originalname
      }
    };
    
    // Add to knowledge base
    knowledgeBase.documents.push(doc);
    
    // Clean up temporary file
    fs.unlinkSync(filePath);
    
    res.status(201).json({
      success: true,
      message: `Added file ${req.file.originalname} to knowledge base`,
      doc_id: doc.id
    });
  } catch (error) {
    console.error('Error in add_file endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add video endpoint
app.post('/api/add/video', (req, res) => {
  try {
    if (!req.body.transcription) {
      return res.status(400).json({ error: 'No transcription provided' });
    }
    
    const { transcription, title } = req.body;
    
    // Generate embedding
    const embedding = generateEmbedding(transcription);
    
    // Create document
    const doc = {
      id: knowledgeBase.nextId++,
      content: transcription,
      embedding,
      metadata: {
        content_type: 'video_transcription',
        title: title || `Video ${knowledgeBase.nextId - 1}`,
        added_at: new Date().toISOString()
      }
    };
    
    // Add to knowledge base
    knowledgeBase.documents.push(doc);
    
    res.status(201).json({
      success: true,
      message: 'Added video transcription to knowledge base',
      doc_id: doc.id
    });
  } catch (error) {
    console.error('Error in add_video endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: "Knowledge Base API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health_check: "/api/health",
      search: "/api/search",
      add_text: "/api/add/text",
      add_file: "/api/add/file",
      add_video: "/api/add/video"
    }
  });
});

// Export for Vercel serverless function
module.exports = app;
