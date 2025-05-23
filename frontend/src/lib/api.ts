// Update API URL for production deployment
import axios from 'axios';

// API service for interacting with the knowledge base backend
// This will be updated to the deployed Vercel API URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://knowledge-base-api-vercel.vercel.app/api' 
  : 'http://localhost:3000/api';

class KnowledgeBaseAPI {
  // Health check endpoint
  static async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Search the knowledge base
  static async search(query: string, k: number = 5) {
    try {
      const response = await axios.post(`${API_URL}/search`, { query, k });
      return response.data;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  // Add text to the knowledge base
  static async addText(text: string, title: string = '', metadata: Record<string, any> = {}) {
    try {
      const response = await axios.post(`${API_URL}/add/text`, {
        text,
        title,
        metadata
      });
      return response.data;
    } catch (error) {
      console.error('Add text failed:', error);
      throw error;
    }
  }

  // Add file to the knowledge base
  static async addFile(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/add/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Add file failed:', error);
      throw error;
    }
  }

  // Add video transcription to the knowledge base
  static async addVideoTranscription(transcription: string, title: string = '') {
    try {
      const formData = new FormData();
      formData.append('transcription', transcription);
      if (title) {
        formData.append('title', title);
      }
      
      const response = await axios.post(`${API_URL}/add/video`, formData);
      return response.data;
    } catch (error) {
      console.error('Add video transcription failed:', error);
      throw error;
    }
  }

  // Add video file to the knowledge base (if backend supports direct video processing)
  static async addVideoFile(videoFile: File, title: string = '') {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (title) {
        formData.append('title', title);
      }
      
      const response = await axios.post(`${API_URL}/add/video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Add video file failed:', error);
      throw error;
    }
  }
}

export default KnowledgeBaseAPI;
