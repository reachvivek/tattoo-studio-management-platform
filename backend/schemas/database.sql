-- Rico Tattoo Artist - Database Schema
-- PostgreSQL 17.6

-- Create database (run this separately if needed)
-- CREATE DATABASE rico_tattoo_db;

-- Drop existing tables
DROP TABLE IF EXISTS crm_activities CASCADE;
DROP TABLE IF EXISTS crm_notes CASCADE;
DROP TABLE IF EXISTS campaign_stats CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Leads Table
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,  -- Removed UNIQUE to allow repeat submissions
    whatsapp_country_code VARCHAR(10) DEFAULT '+49',
    whatsapp_number VARCHAR(20) NOT NULL,
    tattoo_description TEXT NOT NULL,
    reference_images JSON,
    discount_percentage INTEGER DEFAULT 30,
    whatsapp_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'new',
    submission_number INTEGER DEFAULT 1,  -- Track submission count per email
    is_repeat_customer BOOLEAN DEFAULT false,  -- Flag for repeat customers
    lead_source VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CRM Notes Table
CREATE TABLE crm_notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    admin_user_id INTEGER,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- CRM Activities Table
CREATE TABLE crm_activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Stats Table
CREATE TABLE campaign_stats (
    id SERIAL PRIMARY KEY,
    total_leads INTEGER DEFAULT 0,
    total_winners INTEGER DEFAULT 0,
    total_discount_winners INTEGER DEFAULT 0,
    daily_leads INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_email_created ON leads(email, created_at DESC);  -- For tracking repeat submissions
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_whatsapp ON leads(whatsapp_number);
CREATE INDEX idx_leads_is_repeat ON leads(is_repeat_customer);  -- For filtering repeat customers
CREATE INDEX idx_crm_notes_lead_id ON crm_notes(lead_id);
CREATE INDEX idx_crm_activities_lead_id ON crm_activities(lead_id);

-- Initial data
INSERT INTO campaign_stats (total_leads, total_winners, total_discount_winners, daily_leads)
VALUES (0, 0, 0, 0);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_stats_updated_at
BEFORE UPDATE ON campaign_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-set submission_number on insert
CREATE OR REPLACE FUNCTION set_submission_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Count previous submissions from this email
  SELECT COALESCE(MAX(submission_number), 0) + 1
  INTO NEW.submission_number
  FROM leads
  WHERE email = NEW.email;

  -- Mark as repeat customer if not first submission
  NEW.is_repeat_customer := (NEW.submission_number > 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set submission_number
CREATE TRIGGER set_lead_submission_number
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_submission_number();

-- Comments
COMMENT ON TABLE leads IS 'Lead submissions from tattoo giveaway campaign';
COMMENT ON TABLE crm_notes IS 'CRM notes for lead management';
COMMENT ON TABLE crm_activities IS 'Activity log for lead interactions';
COMMENT ON TABLE campaign_stats IS 'Campaign statistics';
COMMENT ON COLUMN leads.submission_number IS 'Tracks which submission number this is for the email (1 = first, 2 = second, etc.)';
COMMENT ON COLUMN leads.is_repeat_customer IS 'True if this is not the first submission from this email';
