const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

async function runDatabaseFixes() {
  try {
    console.log('🔧 Starting database structure fixes...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'fix_database_structure.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await pool.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail if they already exist, which is okay
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate key')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists or not applicable): ${error.message}`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('🎉 Database structure fixes completed successfully!');
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    // Check if service_status constraint exists
    const constraintCheck = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'client_service_items_service_status_check'
    `);
    
    if (constraintCheck.rows.length > 0) {
      console.log('✅ Service status constraint added successfully');
    } else {
      console.log('⚠️  Service status constraint not found');
    }
    
    // Check if created_by columns exist
    const createdByCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_services' AND column_name = 'created_by'
    `);
    
    if (createdByCheck.rows.length > 0) {
      console.log('✅ created_by column added to client_services');
    } else {
      console.log('⚠️  created_by column not found in client_services');
    }
    
    console.log('\n✨ Database verification completed!');
    
  } catch (error) {
    console.error('❌ Error running database fixes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fixes
runDatabaseFixes()
  .then(() => {
    console.log('🚀 Database fixes completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fixes failed:', error);
    process.exit(1);
  });
