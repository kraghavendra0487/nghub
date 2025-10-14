#!/usr/bin/env node

/**
 * Test script for Supabase document upload functionality
 * Run this script to test if Supabase upload is working correctly
 * 
 * Usage: node test-upload.js
 */

require('dotenv').config();
const { uploadDocument, testSupabaseConnection } = require('./config/supabase');

async function testUpload() {
  console.log('🧪 Starting Supabase upload test...\n');
  
  // Test 1: Check environment variables
  console.log('📋 Test 1: Checking environment variables...');
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('💡 Please add these to your .env file:\n');
    missingVars.forEach(varName => {
      console.log(`${varName}=your-${varName.toLowerCase().replace('_', '-')}-here`);
    });
    console.log('\n📖 See backend/env.template for setup instructions');
    return false;
  }
  
  console.log('✅ All required environment variables are present\n');
  
  // Test 2: Test Supabase connection
  console.log('📋 Test 2: Testing Supabase connection...');
  const connectionSuccess = await testSupabaseConnection();
  if (!connectionSuccess) {
    console.log('❌ Supabase connection failed');
    console.log('💡 Please check your SUPABASE_URL and SUPABASE_ANON_KEY');
    return false;
  }
  
  console.log('✅ Supabase connection successful\n');
  
  // Test 3: Test document upload
  console.log('📋 Test 3: Testing document upload...');
  
  // Create a test file
  const testFile = {
    originalname: 'test-document.txt',
    mimetype: 'text/plain',
    size: 20,
    buffer: Buffer.from('This is a test document for Supabase upload.')
  };
  
  console.log('📁 Test file details:', {
    name: testFile.originalname,
    type: testFile.mimetype,
    size: testFile.size
  });
  
  const uploadResult = await uploadDocument(testFile);
  
  if (uploadResult.success) {
    console.log('✅ Document upload successful!');
    console.log('🔗 Upload URL:', uploadResult.url);
    console.log('📁 File path:', uploadResult.filePath);
    console.log('\n🎉 All tests passed! Supabase upload is working correctly.');
    return true;
  } else {
    console.log('❌ Document upload failed:', uploadResult.error);
    console.log('💡 Please check:');
    console.log('   - Your SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('   - You have created a "documents" bucket in Supabase Storage');
    console.log('   - The bucket is accessible with your service role key');
    return false;
  }
}

// Run the test
if (require.main === module) {
  testUpload()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test script error:', error);
      process.exit(1);
    });
}

module.exports = testUpload;
