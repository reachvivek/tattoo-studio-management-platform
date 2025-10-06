-- Migration: Allow duplicate email submissions
-- This allows the same user to submit the form multiple times

-- Drop the unique constraint on email
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_email_key;

-- Add submission_number column to track repeat submissions
ALTER TABLE leads ADD COLUMN IF NOT EXISTS submission_number INTEGER DEFAULT 1;

-- Add is_repeat_customer column for easy filtering
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_repeat_customer BOOLEAN DEFAULT false;

-- Update the email index to be non-unique (for performance)
DROP INDEX IF EXISTS idx_leads_email;
CREATE INDEX idx_leads_email ON leads(email);

-- Create index for tracking submissions by email
CREATE INDEX IF NOT EXISTS idx_leads_email_created ON leads(email, created_at DESC);

-- Update existing leads to set submission_number
WITH numbered_leads AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as row_num
  FROM leads
)
UPDATE leads
SET submission_number = numbered_leads.row_num,
    is_repeat_customer = (numbered_leads.row_num > 1)
FROM numbered_leads
WHERE leads.id = numbered_leads.id;

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

-- Create trigger to auto-set submission_number
DROP TRIGGER IF EXISTS set_lead_submission_number ON leads;
CREATE TRIGGER set_lead_submission_number
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_submission_number();

-- Add comment
COMMENT ON COLUMN leads.submission_number IS 'Tracks which submission number this is for the email (1 = first, 2 = second, etc.)';
COMMENT ON COLUMN leads.is_repeat_customer IS 'True if this is not the first submission from this email';
