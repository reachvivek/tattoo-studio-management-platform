# Follow-Up Email System Setup Guide

## Overview
The follow-up email system automatically sends 4 scheduled emails to leads after they submit the form:
1. **Immediate** - 1 minute after submission
2. **8 Hours** - 8 hours after submission
3. **24 Hours** - 1 day after submission
4. **3 Days** - 3 days after submission

## How It Works

### 1. **Email Queue Service** (`email-queue.service.ts`)
- Stores scheduled emails in the `email_queue` database table
- When a new lead is created, 4 follow-up emails are scheduled

### 2. **Email Processor Service** (`email-processor.service.ts`)
- Runs every 5 minutes (configurable)
- Checks the database for pending emails that are due
- Sends the emails and marks them as sent
- Automatically started when the backend server starts (see `index.ts:37`)

## Current Status on EC2

Your backend is currently running with PM2. The email processor is **automatically started** when the backend starts, so it should already be working.

## To Verify It's Working

### 1. Check if the email_queue table exists:
```bash
# SSH into your EC2 instance
ssh ubuntu@your-ec2-ip

# Connect to PostgreSQL
psql -h your-db-host -U your-db-user -d your-db-name

# Check if email_queue table exists
\dt email_queue

# Check pending emails
SELECT id, email_type, recipient_email, scheduled_at, status, created_at
FROM email_queue
WHERE status = 'pending'
ORDER BY scheduled_at;

# Check sent emails
SELECT id, email_type, recipient_email, sent_at, status
FROM email_queue
WHERE status = 'sent'
ORDER BY sent_at DESC
LIMIT 10;
```

### 2. Check PM2 logs to see if emails are being processed:
```bash
# View backend logs
pm2 logs bookink-backend

# Look for these messages:
# ✅ Email queue processor started
# 📧 Starting email queue processing...
# 📬 Found X pending email(s) to send
# ✅ Sent followup_1 to user@example.com
```

## Deployment Steps (If email_queue table is missing)

### Option 1: Restart the Backend (Recommended)
The `init-database.ts` file has been updated to automatically create the `email_queue` table on startup.

```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Navigate to backend directory
cd /home/ubuntu/tattoo-studio-management-platform/backend

# Restart PM2
pm2 restart bookink-backend

# Check logs to verify table was created
pm2 logs bookink-backend --lines 50
```

You should see:
```
✅ Email Queue table created
✅ Email Queue indexes created
✅ updated_at triggers created
📧 Email queue processor started
```

### Option 2: Manually Create the Table
If the table doesn't exist, you can create it manually:

```bash
# SSH into EC2
ssh ubuntu@your-ec2-ip

# Connect to PostgreSQL (use your actual connection details)
psql -h bookink-db.cxgwkw4oayu0.ap-south-1.rds.amazonaws.com -U bookink_user -d bookink_db

# Run this SQL:
```

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_email_queue_lead_id ON email_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_email_type ON email_queue(email_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled ON email_queue(status, scheduled_at) WHERE status = 'pending';

-- Add trigger for updated_at
CREATE TRIGGER update_email_queue_updated_at
BEFORE UPDATE ON email_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Testing the Follow-Up System

### 1. Submit a Test Lead
Go to your frontend and submit a test lead with a real email address you have access to.

### 2. Check the Database
```sql
-- Check if follow-up emails were scheduled
SELECT * FROM email_queue WHERE lead_id = (SELECT MAX(id) FROM leads);

-- You should see 4 rows with email_type: followup_1, followup_2, followup_3, followup_4
```

### 3. Wait and Check
- **1 minute later**: Check your email for the first follow-up
- **8 hours later**: Check for the second follow-up
- And so on...

### 4. Monitor Logs
```bash
pm2 logs bookink-backend --lines 100

# Look for:
# 📬 Found 1 pending email(s) to send
# ✅ Sent followup_1 to test@example.com (Queue ID: 123)
```

## Troubleshooting

### Issue: No emails are being sent

**Check 1: Email templates exist**
```bash
cd /home/ubuntu/tattoo-studio-management-platform/backend
ls -la dist/templates/

# You should see:
# followup-1-immediate.html
# followup-2-8hours.html
# followup-3-24hours.html
# followup-4-3days.html
```

If templates are missing, rebuild:
```bash
npm run build
pm2 restart bookink-backend
```

**Check 2: Email credentials are correct**
```bash
# Check .env file
cat .env

# Verify these variables:
# EMAIL_USER=noreply.bookink@gmail.com
# EMAIL_PASSWORD=wuby hpmx uomh bhbi
# EMAIL_FROM=BookInk <noreply.bookink@gmail.com>
```

**Check 3: Database connection**
```bash
pm2 logs bookink-backend | grep -i "database"

# Should show:
# ✅ Database connection verified
```

### Issue: Emails are stuck in "pending" status

**Check the scheduled_at time:**
```sql
SELECT id, email_type, scheduled_at, NOW() as current_time, status
FROM email_queue
WHERE status = 'pending';
```

If `scheduled_at` is in the future, the email will be sent when that time arrives.

**Force process the queue manually:**
```bash
# Check if processor is running
pm2 logs bookink-backend | grep -i "email queue"

# Should show every 5 minutes:
# 📧 Starting email queue processing...
```

### Issue: Processor not running

The processor should start automatically when the backend starts. Check:

```bash
pm2 logs bookink-backend | grep -i "Email queue processor started"
```

If you don't see this message, restart:
```bash
pm2 restart bookink-backend
```

## Configuration

### Change Email Sending Interval
Edit `backend/index.ts` line 37:
```typescript
// Current: checks every 5 minutes
emailProcessorService.startScheduler(5);

// Change to every 1 minute:
emailProcessorService.startScheduler(1);
```

Then rebuild and restart:
```bash
npm run build
pm2 restart bookink-backend
```

### Change Follow-Up Schedule
Edit `backend/services/email-queue.service.ts` lines 32-55 to adjust when each email is sent.

## Monitoring

### View Queue Statistics
You can add an API endpoint to view queue stats. The service already has this method:
```typescript
emailQueueService.getQueueStats()
```

### Daily Monitoring
```sql
-- Count emails sent today
SELECT COUNT(*) FROM email_queue
WHERE status = 'sent'
AND DATE(sent_at) = CURRENT_DATE;

-- Count pending emails
SELECT COUNT(*) FROM email_queue WHERE status = 'pending';

-- Count failed emails
SELECT COUNT(*) FROM email_queue WHERE status = 'failed';
```

## Important Notes

1. ✅ **The email processor runs automatically** - No need to set up a separate cron job or PM2 process
2. ✅ **Email templates are already correct** - They use the right WhatsApp link
3. ✅ **Rate limiting is built-in** - Won't exceed Gmail's limits
4. ⚠️ **Make sure email_queue table exists** - Run the deployment steps above if needed
5. ⚠️ **Templates must be in dist/templates/** - They're copied during build

## Summary

After deploying the latest code and restarting PM2, the follow-up email system should work automatically. No additional configuration is needed beyond ensuring:
1. The `email_queue` table exists in the database
2. Email credentials are correct in `.env`
3. The backend is running with PM2

The system is **already integrated** into your main backend process - it doesn't require a separate worker or cron job!
