# Document Upload Implementation for HR Services

## 🎯 Overview
This implementation adds document upload functionality to the HR Services page, allowing users to attach documents when adding services. Documents are stored in Supabase storage and metadata is saved in the database.

## 📋 Features Implemented

### 1. Database Schema
- **Table**: `services_documents`
- **Purpose**: Stores metadata about uploaded documents
- **Location**: `backend/migrations/create_services_documents_table.sql`

### 2. Backend Implementation

#### Supabase Configuration
- **File**: `backend/config/supabase.js`
- **Features**:
  - Supabase client setup with anon and service role keys
  - Connection testing functionality
  - Document upload/delete functions
  - Error handling and logging

#### Database Model
- **File**: `backend/models/ServicesDocument.js`
- **Features**:
  - CRUD operations for document records
  - Service-document relationship queries
  - Pagination support

#### Controller
- **File**: `backend/controllers/documentController.js`
- **Features**:
  - File upload handling with multer
  - Multiple file upload support (up to 5 files)
  - File validation (type and size)
  - Integration with Supabase storage

#### Routes
- **File**: `backend/routes/documentRoutes.js`
- **Endpoints**:
  - `POST /api/documents/service/:serviceId/upload` - Upload documents
  - `GET /api/documents/service/:serviceId` - Get service documents
  - `GET /api/documents/:documentId` - Get specific document
  - `DELETE /api/documents/:documentId` - Delete document
  - `GET /api/documents` - Get all documents (paginated)

### 3. Frontend Implementation

#### Document Upload Component
- **File**: `my-app/src/components/DocumentUpload.jsx`
- **Features**:
  - Drag and drop file upload
  - File type and size validation
  - Multiple file selection
  - File preview with remove option
  - Responsive design

#### Updated Service Forms
- **Files**: 
  - `my-app/src/pages/employee/EmployeeClientServicesPage.jsx`
  - `my-app/src/pages/admin/AdminClientServicesPage.jsx`
- **Features**:
  - Document upload integration
  - File state management
  - Upload progress handling

## 🚀 Setup Instructions

### 1. Database Setup
Run the SQL migration to create the services_documents table:
```sql
-- Execute the contents of backend/migrations/create_services_documents_table.sql
```

### 2. Environment Variables
Add these to your `.env` file:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Supabase Bucket Setup
1. Create a bucket named `service-documents` in your Supabase project
2. Configure appropriate RLS policies if needed
3. Ensure the service role key has storage permissions

### 4. Dependencies
The following packages are required:
- `@supabase/supabase-js` - Supabase client
- `multer` - File upload handling

## 📁 File Structure
```
backend/
├── config/
│   └── supabase.js                 # Supabase configuration
├── controllers/
│   └── documentController.js       # Document upload controller
├── models/
│   └── ServicesDocument.js         # Document database model
├── routes/
│   └── documentRoutes.js           # Document API routes
└── migrations/
    └── create_services_documents_table.sql

my-app/src/
├── components/
│   └── DocumentUpload.jsx          # Document upload component
└── pages/
    ├── employee/
    │   └── EmployeeClientServicesPage.jsx  # Updated with document upload
    └── admin/
        └── AdminClientServicesPage.jsx     # Updated with document upload
```

## 🔧 Usage

### Adding Documents to Services
1. Navigate to HR Services page
2. Click "Add Service"
3. Fill in service details (name, status, remarks)
4. Use the document upload area to:
   - Drag and drop files
   - Click to select files
   - Remove files before submission
5. Submit the form

### Supported File Types
- PDF documents
- Microsoft Word (DOC, DOCX)
- Images (JPG, JPEG, PNG, GIF)
- Microsoft Excel (XLS, XLSX)

### File Limits
- Maximum file size: 10MB per file
- Maximum files per service: 5 files
- Total upload size per service: 50MB

## 🔒 Security Features
- File type validation
- File size limits
- Authentication required for all operations
- Secure file storage in Supabase
- Database constraints and foreign keys

## 🎨 UI/UX Features
- Drag and drop interface
- File preview with icons
- Progress indicators
- Error handling and validation messages
- Responsive design
- Accessibility support

## 🔄 API Integration
The implementation seamlessly integrates with the existing service management system:
- Documents are linked to specific services
- Automatic cleanup when services are deleted
- User tracking for uploaded documents
- Timestamp tracking for audit trails

## 📊 Database Schema Details
```sql
CREATE TABLE services_documents (
    id bigserial PRIMARY KEY,
    service_id bigint NOT NULL REFERENCES client_service_items(id) ON DELETE CASCADE,
    document_url text NOT NULL,
    file_name varchar(255) NOT NULL,
    file_size bigint,
    mime_type varchar(100),
    uploaded_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id varchar(255),
    created_by varchar(255)
);
```

## ✅ Testing Checklist
- [ ] Database table created successfully
- [ ] Supabase connection established
- [ ] File upload functionality works
- [ ] File validation works correctly
- [ ] Multiple file upload works
- [ ] File deletion works
- [ ] UI components render correctly
- [ ] Error handling works
- [ ] Authentication required for uploads
- [ ] File size and type limits enforced

## 🚨 Troubleshooting
1. **Supabase connection issues**: Check environment variables and network connectivity
2. **File upload failures**: Verify bucket permissions and file size limits
3. **Database errors**: Ensure table exists and foreign key constraints are satisfied
4. **UI issues**: Check browser console for JavaScript errors

This implementation provides a complete document upload system that integrates seamlessly with the existing HR Services functionality.
