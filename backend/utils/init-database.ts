import { pool } from '../config/database';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('\n🗄️  ========================================');
    console.log('   Database Schema Initialization');
    console.log('========================================');

    // Check if tables exist
    const checkTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'leads', 'activities')
    `;

    const existingTables = await pool.query(checkTablesQuery);
    const tableNames = existingTables.rows.map((row: any) => row.table_name);

    console.log('Existing tables:', tableNames.length > 0 ? tableNames.join(', ') : 'None');

    if (tableNames.length === 3) {
      console.log('✅ All required tables already exist');
      console.log('========================================\n');
      return;
    }

    console.log('⚙️  Creating missing tables...\n');

    // Create users table
    if (!tableNames.includes('users')) {
      console.log('Creating users table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Users table created');
    }

    // Create leads table
    if (!tableNames.includes('leads')) {
      console.log('Creating leads table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          whatsapp_country_code VARCHAR(10) NOT NULL,
          whatsapp_number VARCHAR(50) NOT NULL,
          tattoo_description TEXT NOT NULL,
          reference_images JSONB DEFAULT '[]',
          discount_percentage INTEGER DEFAULT 30,
          whatsapp_sent BOOLEAN DEFAULT FALSE,
          email_sent BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'new',
          lead_source VARCHAR(100),
          utm_source VARCHAR(255),
          utm_medium VARCHAR(255),
          utm_campaign VARCHAR(255),
          ip_address VARCHAR(100),
          user_agent TEXT,
          submission_number INTEGER DEFAULT 1,
          is_repeat_customer BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Leads table created');

      // Create index on email for faster lookups
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)
      `);
      console.log('✅ Email index created');
    }

    // Create activities table
    if (!tableNames.includes('activities')) {
      console.log('Creating activities table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          activity_type VARCHAR(100) NOT NULL,
          description TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Activities table created');

      // Create index on lead_id for faster lookups
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id)
      `);
      console.log('✅ Activities index created');
    }

    // Create trigger for submission_number auto-increment
    console.log('Creating submission number trigger...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_submission_number()
      RETURNS TRIGGER AS $$
      BEGIN
        SELECT COALESCE(MAX(submission_number), 0) + 1
        INTO NEW.submission_number
        FROM leads
        WHERE email = NEW.email;

        NEW.is_repeat_customer := (NEW.submission_number > 1);

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS set_submission_number_trigger ON leads;
      CREATE TRIGGER set_submission_number_trigger
      BEFORE INSERT ON leads
      FOR EACH ROW
      EXECUTE FUNCTION set_submission_number();
    `);
    console.log('✅ Submission number trigger created');

    console.log('\n✅ Database schema initialization completed successfully!');
    console.log('========================================');
    console.log('Tables created:');
    console.log('  - users (admin accounts)');
    console.log('  - leads (customer submissions)');
    console.log('  - activities (tracking logs)');
    console.log('========================================\n');

  } catch (error: any) {
    console.error('\n❌ Database initialization failed:');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Could not connect to database. Check DATABASE_URL configuration.');
    } else if (error.code === '42P07') {
      console.log('ℹ️  Tables already exist (this is fine)');
    } else {
      console.error('Full error:', error);
    }

    console.log('========================================\n');

    // Don't throw - let the app continue even if DB init fails
    // The error will show in logs but won't crash the server
  }
}
