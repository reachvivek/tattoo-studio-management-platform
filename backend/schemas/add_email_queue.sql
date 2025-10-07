-- Email Queue Table for Follow-up Emails
-- This migration adds an email queue system for automated follow-up emails

-- Email Queue Table
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
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, cancelled
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_email_queue_lead_id ON email_queue(lead_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX idx_email_queue_email_type ON email_queue(email_type);
CREATE INDEX idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) WHERE status = 'pending';

-- Trigger to update updated_at
CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON email_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE email_queue IS 'Queue for automated follow-up emails to leads';
COMMENT ON COLUMN email_queue.email_type IS 'Type of follow-up email: followup_1, followup_2, followup_3, followup_4';
COMMENT ON COLUMN email_queue.status IS 'Current status: pending, sent, failed, cancelled';
COMMENT ON COLUMN email_queue.template_name IS 'Email template to use for rendering';
