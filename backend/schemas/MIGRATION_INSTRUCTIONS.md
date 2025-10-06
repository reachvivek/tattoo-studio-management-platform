# Database Migration Instructions

## Option 1: Run the Migration SQL (Recommended for Existing Data)

If you have existing data and want to preserve it, run the migration script:

```bash
# Windows
set PGPASSWORD=newpassword
psql -U postgres -d bizkit_db -f schemas/migration_allow_duplicate_emails.sql

# Linux/Mac
PGPASSWORD=newpassword psql -U postgres -d bizkit_db -f schemas/migration_allow_duplicate_emails.sql
```

This will:
- Remove the UNIQUE constraint on the email field
- Add `submission_number` and `is_repeat_customer` columns
- Create triggers to automatically track repeat submissions
- Update existing data with submission numbers

## Option 2: Recreate the Database (Fresh Start)

If you don't have important data or want a clean slate:

```bash
# Drop and recreate the database
dropdb -U postgres bizkit_db
createdb -U postgres bizkit_db

# Run the updated schema
psql -U postgres -d bizkit_db -f schemas/database.sql

# Create admin user (run the backend and use the /api/auth/create-admin endpoint)
```

## What Changed

### Database Schema Changes:
1. **Email field**: Removed UNIQUE constraint to allow multiple submissions from same email
2. **New fields**:
   - `submission_number`: Tracks the submission count (1 = first, 2 = second, etc.)
   - `is_repeat_customer`: Boolean flag for easy filtering of repeat submissions

### Backend Changes:
1. **Error Handling**: Production-grade error handling that doesn't expose technical details
2. **Repeat Submission Tracking**: Logs repeat submissions and creates activities with context
3. **User-Friendly Errors**: Maps database errors to user-friendly German messages

### Frontend Changes:
1. **Error Messages**: No more technical database errors shown to users
2. **Image Display**: Fixed image loading from backend server
3. **Robust Error Handling**: Network errors, timeouts, and other issues handled gracefully

## Testing Multiple Submissions

After applying the migration:

1. Submit a form with email `test@example.com`
2. Submit again with the same email
3. In the CRM, you'll see:
   - Both submissions as separate leads
   - Second submission marked as `is_repeat_customer: true`
   - Activity log showing "Wiederholte Anfrage (2. Einreichung) - Vorherige Anfrage: ID X"

## Rollback (if needed)

To revert the changes:

```sql
-- Add back the unique constraint
ALTER TABLE leads ADD CONSTRAINT leads_email_key UNIQUE (email);

-- Drop new columns
ALTER TABLE leads DROP COLUMN submission_number;
ALTER TABLE leads DROP COLUMN is_repeat_customer;

-- Drop trigger and function
DROP TRIGGER IF EXISTS set_lead_submission_number ON leads;
DROP FUNCTION IF EXISTS set_submission_number();
```
