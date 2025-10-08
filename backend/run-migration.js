const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Remove card_number column from cards table...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'remove_card_number_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 The card_number column has been removed from the cards table.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
runMigration();
