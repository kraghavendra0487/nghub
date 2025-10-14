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

    // Test bucket connection first
    console.log('🔍 [SUPABASE] Testing bucket connection...');
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ [SUPABASE] Bucket listing failed:', bucketError);
      throw new Error(`Bucket connection failed: ${bucketError.message}`);
    }

    console.log('📦 [SUPABASE] Available buckets:', buckets.map(b => b.name));
    
    const targetBucket = buckets.find(b => b.name === bucketName);
    if (!targetBucket) {
      console.error(`❌ [SUPABASE] Bucket '${bucketName}' not found`);
      throw new Error(`Bucket '${bucketName}' not found. Available buckets: ${buckets.map(b => b.name).join(', ')}`);
    }

    console.log(`✅ [SUPABASE] Bucket '${bucketName}' found and accessible`);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${timestamp}-${file.originalname}`;
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

module.exports = { 
  supabase, 
  supabaseAdmin, 
  testSupabaseConnection, 
  uploadDocument, 
  deleteDocument 
};
