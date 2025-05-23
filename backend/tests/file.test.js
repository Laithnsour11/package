const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = require('../src/server');
const Document = require('../src/models/Document');

// Test data
const testFilePath = path.join(__dirname, 'test-file.txt');
const testFileContent = 'This is a test file for unit testing';

// Create a test file before tests
beforeAll(async () => {
  // Create a test file
  await fs.promises.writeFile(testFilePath, testFileContent);
  
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/knowledge_base_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up after tests
afterAll(async () => {
  // Remove test file
  if (fs.existsSync(testFilePath)) {
    await fs.promises.unlink(testFilePath);
  }
  
  // Close database connection
  await mongoose.connection.close();
});

// Clear the test database after each test
afterEach(async () => {
  await Document.deleteMany({});
});

describe('File API', () => {
  describe('POST /api/files/upload', () => {
    it('should upload a file', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .attach('file', testFilePath);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('test-file.txt');
      expect(res.body.data.metadata.filename).toBe('test-file.txt');
      expect(res.body.data.metadata.mimeType).toBe('text/plain');
    });

    it('should return 400 if no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/files/:id', () => {
    it('should get a file by ID', async () => {
      // First, upload a file
      const uploadRes = await request(app)
        .post('/api/files/upload')
        .attach('file', testFilePath);
      
      const fileId = uploadRes.body.data.id;
      
      // Then try to get it
      const res = await request(app)
        .get(`/api/files/${fileId}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(testFileContent);
      expect(res.body.data.title).toBe('test-file.txt');
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/files/${nonExistentId}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
