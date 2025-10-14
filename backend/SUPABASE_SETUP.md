# Supabase Document Upload Setup Guide

This guide will help you set up Supabase storage for document uploads in the NGHub application.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your Supabase project credentials

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Create Storage Bucket

1. In your Supabase Dashboard, go to **Storage**
2. Click **"Create a new bucket"**
3. Name: `documents`
4. Make it **Public** (recommended for easy access)
5. Click **"Create bucket"**

## Step 3: Configure Environment Variables

1. Copy `env.template` to `.env`:
   ```bash
   cp env.template .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```env
   # Supabase Storage Configuration
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 4: Test the Setup

1. Start your server:
   ```bash
   npm start
   ```

2. Check the console output for Supabase connection status

3. Run the test script:
   ```bash
   node test-upload.js
   ```

## Step 5: Verify Upload Functionality

1. Use your frontend to upload a document
2. Check the server console for upload logs
3. Verify the document appears in your Supabase Storage dashboard

## Troubleshooting

### Common Issues

**❌ "Missing Supabase environment variables"**
- Make sure you've created a `.env` file with all required variables
- Check that the variable names are exactly as shown

**❌ "Bucket 'documents' not found"**
- Create the storage bucket in Supabase Dashboard → Storage
- Make sure it's named exactly `documents`

**❌ "Upload failed: Invalid JWT"**
- Check your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure you copied the service_role key, not the anon key

**❌ "Connection failed"**
- Verify your `SUPABASE_URL` format: `https://your-project-ref.supabase.co`
- Check your internet connection
- Ensure your Supabase project is active

### Test Commands

```bash
# Test environment variables
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing'); console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing'); console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');"

# Test upload functionality
node test-upload.js

# Start server with detailed logs
npm start
```

## API Endpoints

Once configured, you can use these endpoints:

- **Upload documents**: `POST /api/documents/service/:serviceId/upload`
- **Get service documents**: `GET /api/documents/service/:serviceId`
- **Get document details**: `GET /api/documents/:documentId`
- **Get signed URL for document access**: `GET /api/documents/:documentId/signed-url`
- **Delete document**: `DELETE /api/documents/:documentId`
- **Get all documents (with pagination)**: `GET /api/documents`

## File Upload Details

- **Supported formats**: PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX
- **Max file size**: 10MB
- **Storage location**: Supabase Storage bucket `documents/services/`
- **File naming**: `timestamp-randomstring-originalname`

## Signed URL Access

For secure file access, use signed URLs instead of direct public URLs:

- **Endpoint**: `GET /api/documents/:documentId/signed-url`
- **Authentication**: Required (JWT token)
- **Access Control**: Users can only access their own documents (admins can access all)
- **URL Expiry**: 1 hour (3600 seconds)
- **Response**: Returns a time-limited signed URL for secure file access

### Example Usage

```javascript
// Get signed URL for document access
const response = await fetch('/api/documents/123/signed-url', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

const data = await response.json();
// data.signedUrl contains the temporary access URL
// data.expiresAt contains the expiration timestamp
```

## Security Notes

- Never commit your `.env` file to version control
- The service role key has admin privileges - keep it secure
- Consider implementing additional file validation in production
- Monitor storage usage in your Supabase dashboard

## Support

If you encounter issues:

1. Check the server console logs for detailed error messages
2. Run the test script: `node test-upload.js`
3. Verify your Supabase project settings
4. Check the Supabase documentation for storage setup
