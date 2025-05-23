# Knowledge Base API

This is the backend API for the Knowledge Base System, built with Node.js, Express, and MongoDB.

## Features

- RESTful API endpoints for document management
- File upload support
- Semantic search with vector embeddings
- Authentication and authorization
- Request validation
- Structured logging
- Error handling

## Prerequisites

- Node.js 16+
- MongoDB Atlas account or local MongoDB instance
- Vercel account (for deployment)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/knowledge_base?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Documentation

### Health Check

```
GET /api/health
```

### Create Document

```
POST /api/documents
Content-Type: application/json

{
  "title": "Document Title",
  "content": "Document content here...",
  "tags": ["tag1", "tag2"]
}
```

### Search Documents

```
POST /api/documents/search
Content-Type: application/json

{
  "query": "search query",
  "limit": 10
}
```

## Deployment

### Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Login to Vercel:
   ```bash
   vercel login
   ```
3. Deploy:
   ```bash
   vercel --prod
   ```

## License

MIT
