-- Truncate Analytics Tables
-- This script clears all analytics data while keeping the table structure intact
-- Use this to reset analytics tracking and start fresh with production data

-- Disable triggers temporarily to avoid conflicts
SET session_replication_role = 'replica';

-- Truncate analytics tables (CASCADE will handle foreign key constraints)
TRUNCATE TABLE analytics_events CASCADE;
TRUNCATE TABLE analytics_sessions CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify tables are empty
SELECT 'analytics_events' as table_name, COUNT(*) as row_count FROM analytics_events
UNION ALL
SELECT 'analytics_sessions' as table_name, COUNT(*) as row_count FROM analytics_sessions;

-- Show success message
SELECT 'Analytics tables truncated successfully!' as status;
