-- Analytics Events Schema
-- Tracks all user interactions in the funnel

-- Drop existing tables
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS analytics_sessions CASCADE;

-- Analytics Sessions Table - Track unique user sessions
CREATE TABLE analytics_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_fingerprint VARCHAR(255),  -- Browser fingerprint for tracking
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,  -- Link to lead if they convert
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    referrer TEXT,
    landing_page VARCHAR(500),
    ip_address INET,
    user_agent TEXT,
    browser VARCHAR(100),
    device_type VARCHAR(50),  -- mobile, tablet, desktop
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    first_seen_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    total_events INTEGER DEFAULT 0,
    converted BOOLEAN DEFAULT false,  -- Did they submit the form?
    conversion_time INTEGER,  -- Time to conversion in seconds
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics Events Table - Track individual user actions
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,  -- page_view, form_start, wheel_view, wheel_spin, prize_claim, form_submit, etc.
    event_category VARCHAR(100),  -- navigation, engagement, conversion
    event_label VARCHAR(255),
    page_url VARCHAR(500),
    page_title VARCHAR(255),
    metadata JSON,  -- Additional event data
    time_on_page INTEGER,  -- Seconds spent on page
    scroll_depth INTEGER,  -- Percentage scrolled
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_session
        FOREIGN KEY(session_id)
        REFERENCES analytics_sessions(session_id)
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX idx_analytics_sessions_created_at ON analytics_sessions(created_at DESC);
CREATE INDEX idx_analytics_sessions_converted ON analytics_sessions(converted);
CREATE INDEX idx_analytics_sessions_utm_source ON analytics_sessions(utm_source);
CREATE INDEX idx_analytics_sessions_utm_campaign ON analytics_sessions(utm_campaign);
CREATE INDEX idx_analytics_sessions_device_type ON analytics_sessions(device_type);

CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at DESC);

-- Function to update last_seen_at and total_events in sessions
CREATE OR REPLACE FUNCTION update_session_on_event()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE analytics_sessions
    SET
        last_seen_at = NOW(),
        total_events = total_events + 1,
        updated_at = NOW()
    WHERE session_id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session on new event
CREATE TRIGGER update_session_after_event
AFTER INSERT ON analytics_events
FOR EACH ROW
EXECUTE FUNCTION update_session_on_event();

-- Function to mark session as converted
CREATE OR REPLACE FUNCTION mark_session_converted()
RETURNS TRIGGER AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Find the session for this lead
    SELECT * INTO session_record
    FROM analytics_sessions
    WHERE session_id IN (
        SELECT session_id
        FROM analytics_events
        WHERE metadata::jsonb @> jsonb_build_object('email', NEW.email)
        ORDER BY created_at DESC
        LIMIT 1
    );

    IF session_record IS NOT NULL THEN
        UPDATE analytics_sessions
        SET
            converted = true,
            lead_id = NEW.id,
            conversion_time = EXTRACT(EPOCH FROM (NOW() - session_record.first_seen_at))::INTEGER,
            updated_at = NOW()
        WHERE session_id = session_record.session_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to mark session as converted when lead is created
CREATE TRIGGER mark_converted_on_lead_create
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION mark_session_converted();

-- Comments
COMMENT ON TABLE analytics_sessions IS 'Tracks unique user sessions across the funnel';
COMMENT ON TABLE analytics_events IS 'Tracks individual user events and interactions';
COMMENT ON COLUMN analytics_sessions.session_id IS 'Unique session identifier (UUID from frontend)';
COMMENT ON COLUMN analytics_sessions.user_fingerprint IS 'Browser fingerprint for cross-session tracking';
COMMENT ON COLUMN analytics_sessions.converted IS 'Whether the session resulted in a lead submission';
COMMENT ON COLUMN analytics_sessions.conversion_time IS 'Time from first page view to conversion in seconds';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event: page_view, form_start, wheel_view, wheel_spin, prize_claim, form_submit, button_click, etc.';
COMMENT ON COLUMN analytics_events.time_on_page IS 'Time spent on page in seconds';
COMMENT ON COLUMN analytics_events.scroll_depth IS 'Maximum scroll depth as percentage (0-100)';
