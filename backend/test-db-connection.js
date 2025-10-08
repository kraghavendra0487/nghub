const pool = require('./config/database');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful');
    console.log('📅 Current time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);``
    });
    
    // Test client_services table structure
    const clientServicesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'client_services' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n🏢 client_services table structure:');
    clientServicesColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Test client_service_items table structure
    const serviceItemsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'client_service_items' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📝 client_service_items table structure:');
    serviceItemsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Test service status constraint
    const constraints = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'client_service_items_service_status_check'
    `);
    
    if (constraints.rows.length > 0) {
      console.log('\n✅ Service status constraint found:');
      console.log(`  - ${constraints.rows[0].constraint_name}`);
      console.log(`  - ${constraints.rows[0].check_clause}`);
    } else {
      console.log('\n⚠️  Service status constraint not found');
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testConnection()
  .then(() => {
    console.log('✅ Database connection test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database connection test failed:', error);
    process.exit(1);
  });
