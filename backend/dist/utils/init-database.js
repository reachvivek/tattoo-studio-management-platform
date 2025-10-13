"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const database_1 = require("../config/database");
async function initializeDatabase() {
    try {
        console.log("\n🗄️  ========================================");
        console.log("   Database Schema Initialization");
        console.log("========================================");
        // Check existing tables
        const checkTablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('leads', 'crm_notes', 'crm_activities', 'campaign_stats', 'admin_users', 'email_queue')
    `;
        const existingTables = await database_1.pool.query(checkTablesQuery);
        const tableNames = existingTables.rows.map((row) => row.table_name);
        console.log("Existing tables:", tableNames.length > 0 ? tableNames.join(", ") : "None");
        // Leads Table
        if (!tableNames.includes("leads")) {
            console.log("Creating leads table...");
            await database_1.pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          whatsapp_country_code VARCHAR(10) DEFAULT '+49',
          whatsapp_number VARCHAR(20) NOT NULL,
          tattoo_description TEXT NOT NULL,
          reference_images JSON,
          discount_percentage INTEGER DEFAULT 30,
          whatsapp_sent BOOLEAN DEFAULT false,
          email_sent BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'new',
          submission_number INTEGER DEFAULT 1,
          is_repeat_customer BOOLEAN DEFAULT false,
          lead_source VARCHAR(100),
          utm_source VARCHAR(100),
          utm_medium VARCHAR(100),
          utm_campaign VARCHAR(100),
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log("✅ Leads table created");
            await database_1.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
        CREATE INDEX IF NOT EXISTS idx_leads_email_created ON leads(email, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
        CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp_number);
        CREATE INDEX IF NOT EXISTS idx_leads_is_repeat ON leads(is_repeat_customer);
      `);
            console.log("✅ Leads indexes created");
        }
        // CRM Notes Table
        if (!tableNames.includes("crm_notes")) {
            console.log("Creating crm_notes table...");
            await database_1.pool.query(`
        CREATE TABLE IF NOT EXISTS crm_notes (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          admin_user_id INTEGER,
          note_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log("✅ CRM Notes table created");
            await database_1.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_crm_notes_lead_id ON crm_notes(lead_id)
      `);
            console.log("✅ CRM Notes index created");
        }
        // CRM Activities Table
        if (!tableNames.includes("crm_activities")) {
            console.log("Creating crm_activities table...");
            await database_1.pool.query(`
        CREATE TABLE IF NOT EXISTS crm_activities (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
          activity_type VARCHAR(50) NOT NULL,
          description TEXT,
          metadata JSON,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log("✅ CRM Activities table created");
            await database_1.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities(lead_id)
      `);
            console.log("✅ CRM Activities index created");
        }
        // Campaign Stats Table
        if (!tableNames.includes("campaign_stats")) {
            console.log("Creating campaign_stats table...");
            await database_1.pool.query(`
        CREATE TABLE IF NOT EXISTS campaign_stats (
          id SERIAL PRIMARY KEY,
          total_leads INTEGER DEFAULT 0,
          total_winners INTEGER DEFAULT 0,
          total_discount_winners INTEGER DEFAULT 0,
          daily_leads INTEGER DEFAULT 0,
          last_reset_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log("✅ Campaign Stats table created");
            await database_1.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_campaign_stats_id ON campaign_stats(id)
      `);
            console.log("✅ Campaign Stats index created");
            await database_1.pool.query(`
        INSERT INTO campaign_stats (total_leads, total_winners, total_discount_winners, daily_leads)
        VALUES (0, 0, 0, 0)
        ON CONFLICT DO NOTHING
      `);
            console.log("✅ Campaign Stats initial data inserted");
        }
        // Admin Users Table
        if (!tableNames.includes("admin_users")) {
            console.log("Creating admin_users table...");
            await database_1.pool.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log("✅ Admin Users table created");
        }
        // Email Queue Table
        if (!tableNames.includes("email_queue")) {
            console.log("Creating email_queue table...");
            await database_1.pool.query(`
        CREATE TABLE IF NOT EXISTS email_queue (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
          email_type VARCHAR(50) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          template_name VARCHAR(100) NOT NULL,
          recipient_email VARCHAR(255) NOT NULL,
          recipient_name VARCHAR(255) NOT NULL,
          scheduled_at TIMESTAMP NOT NULL,
          sent_at TIMESTAMP,
          status VARCHAR(50) DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          error_message TEXT,
          metadata JSON,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
            console.log("✅ Email Queue table created");
            await database_1.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_email_queue_lead_id ON email_queue(lead_id);
        CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
        CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_email_queue_email_type ON email_queue(email_type);
        CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) WHERE status = 'pending';
      `);
            console.log("✅ Email Queue indexes created");
        }
        // Trigger: updated_at auto-update
        await database_1.pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
      CREATE TRIGGER update_leads_updated_at
      BEFORE UPDATE ON leads
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_campaign_stats_updated_at ON campaign_stats;
      CREATE TRIGGER update_campaign_stats_updated_at
      BEFORE UPDATE ON campaign_stats
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
      CREATE TRIGGER update_email_queue_updated_at
      BEFORE UPDATE ON email_queue
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
        console.log("✅ updated_at triggers created");
        // Trigger: submission_number auto-set
        await database_1.pool.query(`
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

      DROP TRIGGER IF EXISTS set_lead_submission_number ON leads;
      CREATE TRIGGER set_lead_submission_number
      BEFORE INSERT ON leads
      FOR EACH ROW EXECUTE FUNCTION set_submission_number();
    `);
        console.log("✅ Submission number trigger created");
        console.log("\n✅ Database schema initialization completed successfully!");
        console.log("========================================\n");
    }
    catch (error) {
        console.error("\n❌ Database initialization failed:", error.message);
        if (error.code === "ECONNREFUSED") {
            console.error("⚠️ Could not connect to database. Check DATABASE_URL configuration.");
        }
        else if (error.code === "42P07") {
            console.log("ℹ️ Tables already exist (this is fine)");
        }
        else {
            console.error("Full error:", error);
        }
    }
}
//# sourceMappingURL=init-database.js.map