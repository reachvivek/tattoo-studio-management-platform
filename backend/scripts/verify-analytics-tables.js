const { Pool } = require('pg');
require('dotenv').config();

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

async function verifyTables() {
  try {
    console.log('🔍 Verifying analytics tables...\n');

    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('analytics_sessions', 'analytics_events')
      ORDER BY table_name
    `);

    console.log('📋 Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    if (tablesResult.rows.length === 0) {
      console.log('\n❌ No analytics tables found! Please run migration first.');
      process.exit(1);
    }

    // Check session columns
    console.log('\n📊 analytics_sessions columns:');
    const sessionColsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'analytics_sessions'
      ORDER BY ordinal_position
    `);
    sessionColsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check events columns
    console.log('\n📊 analytics_events columns:');
    const eventsColsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'analytics_events'
      ORDER BY ordinal_position
    `);
    eventsColsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Test data count
    const sessionCount = await pool.query('SELECT COUNT(*) FROM analytics_sessions');
    const eventCount = await pool.query('SELECT COUNT(*) FROM analytics_events');

    console.log(`\n📈 Current data:`);
    console.log(`   Sessions: ${sessionCount.rows[0].count}`);
    console.log(`   Events: ${eventCount.rows[0].count}`);

    console.log('\n✅ All analytics tables verified successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyTables();
