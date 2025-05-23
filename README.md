# Knowledge Base System Deployment Package

This package contains a complete knowledge base system with front and back end components, ready for deployment on Vercel.

## System Overview

The knowledge base system consists of:

1. **Frontend (React)**
   - File upload component for adding documents
   - Text editor for direct knowledge input
   - Video recording interface
   - Search interface to query the knowledge base

2. **Backend (Node.js/Express)**
   - Document processing for multiple file types
   - Vector embedding generation
   - Semantic search capabilities
   - RESTful API endpoints

## Deployment Instructions

Please follow the detailed instructions in the `docs/vercel_deployment.md` file to deploy both the frontend and backend to Vercel.

## Project Structure

```
knowledge_base_project/
├── frontend/               # React frontend
│   ├── src/                # Source code
│   ├── dist/               # Built files (ready for deployment)
│   └── vercel.json         # Vercel configuration
│
├── backend/                # Node.js backend
│   ├── api/                # API routes (serverless functions)
│   └── vercel.json         # Vercel configuration
│
└── docs/                   # Documentation
    └── vercel_deployment.md # Deployment instructions
```

## Security Notes

- Never share your Vercel credentials with any AI system or third party
- Deploy the application yourself using the Vercel CLI
- Follow security best practices when managing your deployed application

## After Deployment

After successful deployment:

1. Update the API URL in the frontend if needed
2. Test all functionality on the live deployment
3. Set up proper domain linking if using custom domains

## Support

If you encounter any issues during deployment, refer to the Vercel documentation or contact Vercel support.
