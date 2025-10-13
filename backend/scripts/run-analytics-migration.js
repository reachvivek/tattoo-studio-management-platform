const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration for Aiven
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Connecting to Aiven database...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    console.log(`   Port: ${process.env.DB_PORT}`);

    // Read the SQL schema file
    const sqlPath = path.join(__dirname, '../schemas/analytics_events.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('\n📊 Running analytics migration...');
    console.log('   Creating analytics_sessions table...');
    console.log('   Creating analytics_events table...');
    console.log('   Creating indexes...');
    console.log('   Creating triggers and functions...');

    // Execute the SQL
    await client.query(sql);

    console.log('\n✅ Analytics migration completed successfully!');
    console.log('\n📋 Created tables:');
    console.log('   - analytics_sessions');
    console.log('   - analytics_events');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('analytics_sessions', 'analytics_events')
      ORDER BY table_name
    `);

    console.log('\n🔍 Verification:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name} exists`);
    });

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('analytics_sessions', 'analytics_events')
      ORDER BY indexname
    `);

    console.log(`\n📊 Created ${indexResult.rows.length} indexes`);

    // Check triggers
    const triggerResult = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE event_object_table IN ('analytics_sessions', 'analytics_events', 'leads')
      AND trigger_name IN ('update_session_after_event', 'mark_converted_on_lead_create')
    `);

    console.log(`\n⚡ Created ${triggerResult.rows.length} triggers`);
    triggerResult.rows.forEach(row => {
      console.log(`   ✓ ${row.trigger_name} on ${row.event_object_table}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration();
