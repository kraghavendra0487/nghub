require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
}

// Create client with anon key for general operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create client with service role key for storage operations (bypasses RLS)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Function to test Supabase bucket storage connection
const testSupabaseConnection = async () => {
  try {
    console.log('🟡 Testing Supabase bucket storage connection...');
    
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.log('❌ Supabase environment variables not configured');
      return false;
    }
    
    console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`🔑 Supabase Key: ${process.env.SUPABASE_ANON_KEY.substring(0, 10)}...`);
    
    // Validate URL format
    if (!process.env.SUPABASE_URL.includes('.supabase.co')) {
      console.log('⚠️  Warning: Supabase URL format may be incorrect. Expected format: https://project.supabase.co');
    }
    
    // Test basic connection first with a simple query
    console.log('🔍 Testing basic Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('services_documents')
      .select('count', { count: 'exact', head: true });
    
    if (testError && testError.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok
      console.log('❌ Supabase basic connection failed:', testError.message);
      return false;
    }
    
    console.log('✅ Supabase basic connection successful');
    
    // Test storage connection
    console.log('🔍 Testing Supabase storage connection...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Supabase bucket storage connection failed:', error.message);
      console.log('   This may be due to insufficient permissions or incorrect URL format.');
      return false;
    }
    
    console.log(`✅ Supabase bucket storage connection successful. Found ${buckets.length} bucket(s):`);
    buckets.forEach(bucket => {
      console.log(`   📦 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Supabase connection test failed:', error.message);
    console.log('   This may indicate configuration issues or network problems.');
    return false;
  }
};

// Function to upload document to Supabase storage
const uploadDocument = async (file, bucketName = 'documents') => {
  console.log('🚀 [SUPABASE] Starting document upload process...');
  console.log('📁 [SUPABASE] File details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    bufferLength: file.buffer?.length
  });
  console.log('🪣 [SUPABASE] Bucket name:', bucketName);

  try {
    if (!supabaseAdmin) {
      console.error('❌ [SUPABASE] Admin client not configured');
      throw new Error('Supabase admin client not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
    }

    console.log('✅ [SUPABASE] Admin client configured');

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty or invalid');
    }

    // Generate unique filename with better naming
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${randomString}-${sanitizedFileName}`;
    const filePath = `services/${fileName}`;

    console.log('📝 [SUPABASE] Generated file path:', filePath);

    // Upload file to Supabase storage
    console.log('⬆️ [SUPABASE] Uploading file to storage...');
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('❌ [SUPABASE] Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ [SUPABASE] File uploaded successfully:', data);

    // Get public URL
    console.log('🔗 [SUPABASE] Getting public URL...');
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('✅ [SUPABASE] Public URL generated:', urlData.publicUrl);

    const result = {
      success: true,
      url: urlData.publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: filePath
    };

    console.log('🎉 [SUPABASE] Upload process completed successfully:', result);
    return result;

  } catch (error) {
    console.error('💥 [SUPABASE] Document upload error:', error);
    console.error('💥 [SUPABASE] Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to delete document from Supabase storage
const deleteDocument = async (filePath, bucketName = 'documents') => {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Document delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to generate signed URL for document access
const getSignedUrl = async (filePath, bucketName = 'documents', expiresIn = 3600) => {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }

    console.log('🔗 [SUPABASE] Generating signed URL for:', filePath);
    console.log('⏰ [SUPABASE] Expires in:', expiresIn, 'seconds');

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (signedUrlError) {
      console.error('❌ [SUPABASE] Signed URL generation failed:', signedUrlError);
      throw new Error(`Failed to generate signed URL: ${signedUrlError.message}`);
    }

    console.log('✅ [SUPABASE] Signed URL generated successfully');
    return {
      success: true,
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    };
  } catch (error) {
    console.error('💥 [SUPABASE] Signed URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to test document upload with a sample file
const testDocumentUpload = async () => {
  try {
    console.log('🧪 [SUPABASE] Testing document upload...');
    
    if (!supabaseAdmin) {
      console.error('❌ [SUPABASE] Admin client not configured for test');
      return false;
    }
    
    // Create a test file buffer
    const testFile = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: 12,
      buffer: Buffer.from('Hello World!')
    };
    
    const result = await uploadDocument(testFile);
    
    if (result.success) {
      console.log('✅ [SUPABASE] Test upload successful:', result.url);
      return true;
    } else {
      console.error('❌ [SUPABASE] Test upload failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('💥 [SUPABASE] Test upload error:', error);
    return false;
  }
};

module.exports = { 
  supabase, 
  supabaseAdmin, 
  testSupabaseConnection, 
  uploadDocument, 
  deleteDocument,
  getSignedUrl,
  testDocumentUpload
};
