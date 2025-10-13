/**
 * Truncate Analytics Tables Script
 * This script clears all analytics data while keeping the table structure intact
 * Use this to reset analytics tracking and start fresh with production data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function truncateAnalyticsTables() {
  const client = await pool.connect();

  try {
    console.log('🔄 Connecting to database...');

    // Start transaction
    await client.query('BEGIN');

    console.log('🗑️  Truncating analytics_events table...');
    await client.query('TRUNCATE TABLE analytics_events CASCADE');

    console.log('🗑️  Truncating analytics_sessions table...');
    await client.query('TRUNCATE TABLE analytics_sessions CASCADE');

    // Commit transaction
    await client.query('COMMIT');

    // Verify tables are empty
    console.log('\n✅ Verifying tables are empty...');

    const eventsCount = await client.query('SELECT COUNT(*) FROM analytics_events');
    const sessionsCount = await client.query('SELECT COUNT(*) FROM analytics_sessions');

    console.log(`   analytics_events: ${eventsCount.rows[0].count} rows`);
    console.log(`   analytics_sessions: ${sessionsCount.rows[0].count} rows`);

    if (eventsCount.rows[0].count === '0' && sessionsCount.rows[0].count === '0') {
      console.log('\n✅ Analytics tables truncated successfully!');
      console.log('   Ready to start tracking fresh production data.');
    } else {
      console.log('\n⚠️  Warning: Tables may not be completely empty.');
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error truncating analytics tables:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the script
truncateAnalyticsTables()
  .then(() => {
    console.log('\n✨ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
