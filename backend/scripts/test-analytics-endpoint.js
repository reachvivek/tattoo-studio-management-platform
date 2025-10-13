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

async function testQuery() {
  try {
    console.log('🧪 Testing analytics funnel query...\n');

    const funnelQuery = `
      WITH funnel_data AS (
        SELECT
          session_id,
          MAX(CASE WHEN event_type = 'page_view' AND page_url LIKE '%lead-form%' THEN 1 ELSE 0 END) as visited_landing,
          MAX(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) as submitted_form,
          MAX(CASE WHEN event_type = 'wheel_view' THEN 1 ELSE 0 END) as viewed_wheel,
          MAX(CASE WHEN event_type = 'wheel_spin' THEN 1 ELSE 0 END) as spun_wheel,
          MAX(CASE WHEN event_type = 'prize_claim' THEN 1 ELSE 0 END) as claimed_prize,
          MAX(CASE WHEN event_type = 'whatsapp_redirect' THEN 1 ELSE 0 END) as whatsapp_redirect
        FROM analytics_events
        GROUP BY session_id
      )
      SELECT
        COUNT(DISTINCT session_id) as total_sessions,
        SUM(visited_landing) as visited_landing,
        SUM(submitted_form) as submitted_form,
        SUM(viewed_wheel) as viewed_wheel,
        SUM(spun_wheel) as spun_wheel,
        SUM(claimed_prize) as claimed_prize,
        SUM(whatsapp_redirect) as whatsapp_redirect
      FROM funnel_data
    `;

    console.log('Running query...');
    const start = Date.now();
    const result = await pool.query(funnelQuery);
    const duration = Date.now() - start;

    console.log(`\n✅ Query completed in ${duration}ms\n`);
    console.log('Result:', JSON.stringify(result.rows[0], null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testQuery();
