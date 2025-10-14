const multer = require('multer');
const ServicesDocument = require('../models/ServicesDocument');
const { uploadDocument, deleteDocument } = require('../config/supabase');

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 [MULTER] File filter called for:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Accept common document and image types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log('✅ [MULTER] File type accepted:', file.mimetype);
      cb(null, true);
    } else {
      console.log('❌ [MULTER] File type rejected:', file.mimetype);
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX files are allowed.'), false);
    }
  }
});

// Add logging middleware to see what multer is doing
const uploadWithLogging = upload.array('documents', 5);
const uploadMiddleware = (req, res, next) => {
  console.log('🚀 [MULTER MIDDLEWARE] Starting file processing...');
  console.log('📋 [MULTER MIDDLEWARE] Request details:', {
    method: req.method,
    url: req.url,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });
  
  uploadWithLogging(req, res, (err) => {
    if (err) {
      console.error('❌ [MULTER MIDDLEWARE] Multer error:', err);
      return next(err);
    }
    
    console.log('✅ [MULTER MIDDLEWARE] Files processed:', {
      filesCount: req.files?.length || 0,
      files: req.files?.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        bufferLength: f.buffer?.length
      })) || []
    });
    
    next();
  });
};

class DocumentController {
  // Upload documents for a service
  static async uploadDocuments(req, res) {
    console.log('🚀 [DOCUMENT CONTROLLER] Starting document upload process...');
    console.log('📋 [DOCUMENT CONTROLLER] Request details:', {
      serviceId: req.params.serviceId,
      userId: req.user?.id,
      createdBy: req.user?.username || req.user?.email,
      filesCount: req.files?.length || 0,
      userAgent: req.get('User-Agent')
    });

    try {
      const { serviceId } = req.params;
      const userId = req.user.id;
      const createdBy = req.user.username || req.user.email;

      console.log('✅ [DOCUMENT CONTROLLER] User authentication verified:', { userId, createdBy });

      if (!req.files || req.files.length === 0) {
        console.error('❌ [DOCUMENT CONTROLLER] No files in request');
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('📁 [DOCUMENT CONTROLLER] Processing files:', req.files.map(f => ({
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      })));

      const uploadedDocuments = [];
      const errors = [];

      // Process each file
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        console.log(`🔄 [DOCUMENT CONTROLLER] Processing file ${i + 1}/${req.files.length}: ${file.originalname}`);
        
        try {
          // Upload to Supabase
          console.log(`⬆️ [DOCUMENT CONTROLLER] Uploading ${file.originalname} to Supabase...`);
          const uploadResult = await uploadDocument(file);
          
          console.log(`📊 [DOCUMENT CONTROLLER] Upload result for ${file.originalname}:`, uploadResult);
          
          if (uploadResult.success) {
            // Save document info to database
            const documentData = {
              service_id: serviceId,
              document_url: uploadResult.url,
              file_name: uploadResult.fileName,
              file_size: uploadResult.fileSize,
              mime_type: uploadResult.mimeType,
              user_id: userId,
              created_by: createdBy
            };

            console.log(`💾 [DOCUMENT CONTROLLER] Saving to database:`, documentData);
            
            const document = await ServicesDocument.create(documentData);
            console.log(`✅ [DOCUMENT CONTROLLER] Document saved to database:`, document);
            
            uploadedDocuments.push(document);
          } else {
            console.error(`❌ [DOCUMENT CONTROLLER] Upload failed for ${file.originalname}:`, uploadResult.error);
            errors.push(`${file.originalname}: ${uploadResult.error}`);
          }
        } catch (error) {
          console.error(`💥 [DOCUMENT CONTROLLER] Error uploading file ${file.originalname}:`, error);
          console.error(`💥 [DOCUMENT CONTROLLER] Error stack:`, error.stack);
          errors.push(`${file.originalname}: Upload failed - ${error.message}`);
        }
      }

      console.log(`📊 [DOCUMENT CONTROLLER] Final results:`, {
        uploadedCount: uploadedDocuments.length,
        errorsCount: errors.length,
        errors: errors
      });

      if (uploadedDocuments.length > 0) {
        console.log('🎉 [DOCUMENT CONTROLLER] Upload process completed successfully');
        res.status(201).json({
          message: `${uploadedDocuments.length} document(s) uploaded successfully`,
          documents: uploadedDocuments,
          errors: errors.length > 0 ? errors : undefined
        });
      } else {
        console.error('❌ [DOCUMENT CONTROLLER] No documents were uploaded successfully');
        res.status(400).json({
          error: 'No documents were uploaded',
          details: errors
        });
      }
    } catch (error) {
      console.error('💥 [DOCUMENT CONTROLLER] Fatal error in upload process:', error);
      console.error('💥 [DOCUMENT CONTROLLER] Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to upload documents' });
    }
  }

  // Get all documents for a service
  static async getServiceDocuments(req, res) {
    console.log('🔍 [DOCUMENT CONTROLLER] Fetching documents for service:', req.params.serviceId);
    
    try {
      const { serviceId } = req.params;
      
      const documents = await ServicesDocument.findByServiceId(serviceId);
      console.log(`📊 [DOCUMENT CONTROLLER] Found ${documents.length} documents for service ${serviceId}:`, documents);
      
      res.json(documents);
    } catch (error) {
      console.error('❌ [DOCUMENT CONTROLLER] Error fetching service documents:', error);
      console.error('❌ [DOCUMENT CONTROLLER] Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  // Get document by ID
  static async getDocument(req, res) {
    try {
      const { documentId } = req.params;
      
      const document = await ServicesDocument.findById(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }

  // Delete document
  static async deleteDocument(req, res) {
    try {
      const { documentId } = req.params;
      
      // Get document info first
      const document = await ServicesDocument.findById(documentId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete from Supabase storage (extract file path from URL)
      const urlParts = document.document_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `services/${fileName}`;
      
      const deleteResult = await deleteDocument(filePath);
      
      if (deleteResult.success) {
        // Delete from database
        await ServicesDocument.delete(documentId);
        
        res.json({ message: 'Document deleted successfully' });
      } else {
        console.error('Error deleting from Supabase:', deleteResult.error);
        // Still delete from database even if Supabase delete fails
        await ServicesDocument.delete(documentId);
        res.json({ 
          message: 'Document deleted from database. Note: File may still exist in storage.',
          warning: deleteResult.error
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  // Get all documents with pagination
  static async getAllDocuments(req, res) {
    try {
      const { page = 1, limit = 10, serviceId, userId } = req.query;
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        serviceId,
        userId
      };
      
      const result = await ServicesDocument.findAll(options);
      res.json(result);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }
}

module.exports = { DocumentController, upload, uploadMiddleware };
