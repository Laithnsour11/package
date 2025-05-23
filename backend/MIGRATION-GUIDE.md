# MongoDB to PostgreSQL Migration Guide

This guide will help you migrate your data from MongoDB to PostgreSQL using the provided migration script.

## Prerequisites

1. Node.js (v14 or later)
2. PostgreSQL (v12 or later) with pgvector extension
3. MongoDB (to read data from)
4. `dotenv` package installed

## Setup

1. Install the required dependencies:
   ```bash
   npm install pg mongoose dotenv
   ```

2. Create a `.env` file in the `backend` directory with the following variables:
   ```
   # MongoDB connection
   MONGODB_URI=mongodb://your-mongodb-connection-string
   
   # PostgreSQL connection
   PGUSER=your_postgres_user
   PGPASSWORD=your_postgres_password
   PGHOST=your_postgres_host
   PGPORT=5432
   PGDATABASE=knowledge_base
   NODE_ENV=development
   ```

## Running the Migration

1. Ensure your MongoDB and PostgreSQL servers are running

2. Run the migration script:
   ```bash
   cd backend
   node scripts/migrate-to-postgres.js
   ```

3. The script will:
   - Create the necessary tables in PostgreSQL
   - Migrate all documents from MongoDB to PostgreSQL
   - Preserve relationships and metadata

## Post-Migration Steps

1. Update your application code to use PostgreSQL instead of MongoDB
2. Update your environment variables in production
3. Test thoroughly before deploying to production

## Troubleshooting

- **Connection Issues**: Verify your database connection strings and ensure both databases are accessible
- **Permission Errors**: Ensure the PostgreSQL user has permissions to create tables and insert data
- **Data Mismatch**: The migration maps MongoDB's `_id` to a new auto-incrementing ID in PostgreSQL

## Rollback Plan

If you need to rollback:
1. Keep your MongoDB data intact until you've verified the migration
2. The migration doesn't modify your MongoDB data
3. You can drop the PostgreSQL tables and restart the migration if needed

## Support

For issues, please open an issue in the repository with detailed error messages and steps to reproduce.
