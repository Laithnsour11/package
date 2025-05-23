const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const Document = require('../src/models/Document');

// Test data
const testDocument = {
  title: 'Test Document',
  content: 'This is a test document for unit testing',
  tags: ['test', 'unit']
};

// Connect to a test database before running tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge_base_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clear the test database after each test
afterEach(async () => {
  await Document.deleteMany({});
});

// Close the database connection after all tests are done
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Document API', () => {
  describe('POST /api/documents', () => {
    it('should create a new document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send(testDocument);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testDocument.title);
      expect(res.body.data.content).toBe(testDocument.content);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/documents')
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/documents/search', () => {
    it('should search for documents', async () => {
      // First, create a test document
      await Document.create({
        ...testDocument,
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      });

      const res = await request(app)
        .post('/api/documents/search')
        .send({
          query: 'test document',
          limit: 5
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 400 if query is missing', async () => {
      const res = await request(app)
        .post('/api/documents/search')
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});
