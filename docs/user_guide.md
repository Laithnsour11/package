# Knowledge Base System User Guide

## Overview

This document provides instructions for using the Knowledge Base System, a comprehensive solution for storing, retrieving, and managing knowledge through various input modalities.

## System Architecture

The Knowledge Base System consists of two main components:

1. **Frontend**: A React-based user interface that allows for:
   - File uploads (PDF, DOCX, TXT, CSV, JSON)
   - Direct text input
   - Video recording
   - Knowledge base searching

2. **Backend**: A Flask-based API server that provides:
   - Document processing and chunking
   - Vector embedding generation
   - FAISS-based vector storage
   - Semantic search capabilities
   - RESTful API endpoints

## Getting Started

### Prerequisites

- Node.js (v16+) for the frontend
- Python 3.11+ for the backend
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Starting the Backend

1. Navigate to the backend directory:
   ```
   cd knowledge_base_project/backend
   ```

2. Activate the virtual environment:
   ```
   source venv/bin/activate
   ```

3. Start the Flask server:
   ```
   python -m src.main
   ```

4. The backend will be available at `http://localhost:5000`

### Starting the Frontend

1. Navigate to the frontend directory:
   ```
   cd knowledge_base_project/frontend
   ```

2. Install dependencies (first time only):
   ```
   pnpm install
   ```

3. Start the development server:
   ```
   pnpm run dev
   ```

4. The frontend will be available at `http://localhost:5173`

## Using the Knowledge Base

### Adding Content

#### File Upload

1. Navigate to the "File Upload" tab
2. Drag and drop files or click to browse
3. Select files (PDF, DOCX, TXT, CSV, JSON)
4. Click "Upload Files"

#### Text Input

1. Navigate to the "Text Input" tab
2. Enter a title (optional)
3. Type or paste your content
4. Click "Save" (or enable auto-save)

#### Video Recording

1. Navigate to the "Video Recording" tab
2. Allow camera and microphone access when prompted
3. Click "Start Recording"
4. Use "Pause" and "Resume" as needed
5. Click "Stop" when finished
6. Click "Save to Knowledge Base"

### Searching the Knowledge Base

1. Navigate to the "Search" tab
2. Enter your query in the search box
3. Click "Search"
4. View results ranked by relevance

## API Documentation

The backend provides the following API endpoints:

### Health Check

- **URL**: `/api/health`
- **Method**: GET
- **Response**: `{"status": "ok", "message": "API is running"}`

### Search

- **URL**: `/api/search`
- **Method**: POST
- **Body**:
  ```json
  {
    "query": "your search query",
    "k": 5  // Number of results (optional, default: 5)
  }
  ```
- **Response**: List of matching documents with relevance scores

### Add Text

- **URL**: `/api/add/text`
- **Method**: POST
- **Body**:
  ```json
  {
    "text": "Your text content",
    "title": "Optional title",
    "metadata": {
      "author": "Optional author",
      "date": "Optional date"
    }
  }
  ```
- **Response**: Success message with document IDs

### Add File

- **URL**: `/api/add/file`
- **Method**: POST
- **Body**: Form data with file
- **Response**: Success message with document IDs

### Add Video

- **URL**: `/api/add/video`
- **Method**: POST
- **Body**: Form data with video file or transcription
- **Response**: Success message with document IDs

## Extending the System

### Adding New File Types

To support additional file types, modify the `DocumentProcessor` class in `backend/src/models/document_processor.py`.

### Customizing Embedding Model

To use a different embedding model, modify the `model_name` parameter in the `EmbeddingGenerator` class in `backend/src/models/knowledge_base.py`.

### Adjusting Chunking Parameters

To change how documents are split into chunks, modify the `chunk_size` and `chunk_overlap` parameters in the `DocumentProcessor` class.

## Troubleshooting

### Frontend Issues

- **API Connection Errors**: Ensure the backend server is running and CORS is properly configured
- **Video Recording Issues**: Check browser permissions for camera and microphone access

### Backend Issues

- **Dependency Errors**: Ensure all required packages are installed in the virtual environment
- **Storage Errors**: Check that the data directory exists and has proper permissions

## Support

For additional support or feature requests, please contact the development team.
