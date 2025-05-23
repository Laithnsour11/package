# Vercel Deployment Instructions

## Frontend Deployment

1. Navigate to the frontend directory:
   ```
   cd knowledge_base_project/frontend
   ```

2. Install Vercel CLI (if not already installed):
   ```
   npm install -g vercel
   ```

3. Login to Vercel:
   ```
   vercel login
   ```

4. Deploy the frontend:
   ```
   vercel --prod
   ```

5. Follow the prompts to complete the deployment.

## Backend Deployment

1. Navigate to the backend directory:
   ```
   cd knowledge_base_project/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Deploy the backend:
   ```
   vercel --prod
   ```

4. Follow the prompts to complete the deployment.

## Connecting Frontend to Backend

After deployment, you'll need to update the API URL in the frontend to point to your deployed backend API. The current configuration assumes the backend will be deployed at `https://knowledge-base-api-vercel.vercel.app`.

If your backend is deployed at a different URL, update the `API_URL` in `frontend/src/lib/api.ts`.

## Environment Variables

You may need to set the following environment variables in your Vercel project settings:

- `NODE_ENV`: Set to `production` for production deployments

## Vercel Project Settings

For optimal performance and functionality:

1. Enable CORS in your backend project settings
2. Configure proper build settings for both projects
3. Set up proper domain linking if using custom domains

## Troubleshooting

If you encounter issues with the deployment:

1. Check the Vercel deployment logs
2. Verify that all dependencies are properly installed
3. Ensure that the API endpoints are correctly configured
4. Check for any CORS issues between frontend and backend
