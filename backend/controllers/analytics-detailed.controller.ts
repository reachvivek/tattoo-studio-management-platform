import { Request, Response } from 'express';
import { pool } from '../config/database';

export class AnalyticsDetailedController {
  // Get funnel overview statistics
  async getFunnelStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = this.buildDateFilter(startDate as string, endDate as string);

      // Get funnel step counts (Updated to match actual funnel: Landing -> Form Submit -> Wheel -> Spin -> Claim -> WhatsApp)
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
          ${dateFilter}
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

      const funnelResult = await pool.query(funnelQuery);
      const funnel = funnelResult.rows[0];

      // Calculate conversion rates
      const totalSessions = parseInt(funnel.total_sessions) || 1;
      const conversionRates = {
        landing_to_form: ((funnel.submitted_form / totalSessions) * 100).toFixed(2),
        form_to_wheel: ((funnel.viewed_wheel / (funnel.submitted_form || 1)) * 100).toFixed(2),
        wheel_to_spin: ((funnel.spun_wheel / (funnel.viewed_wheel || 1)) * 100).toFixed(2),
        spin_to_claim: ((funnel.claimed_prize / (funnel.spun_wheel || 1)) * 100).toFixed(2),
        claim_to_whatsapp: ((funnel.whatsapp_redirect / (funnel.claimed_prize || 1)) * 100).toFixed(2),
        overall_conversion: ((funnel.whatsapp_redirect / totalSessions) * 100).toFixed(2)
      };

      res.json({
        success: true,
        data: {
          funnel_steps: {
            total_sessions: parseInt(funnel.total_sessions),
            visited_landing: parseInt(funnel.visited_landing),
            submitted_form: parseInt(funnel.submitted_form),
            viewed_wheel: parseInt(funnel.viewed_wheel),
            spun_wheel: parseInt(funnel.spun_wheel),
            claimed_prize: parseInt(funnel.claimed_prize),
            whatsapp_redirect: parseInt(funnel.whatsapp_redirect)
          },
          conversion_rates: conversionRates
        }
      });
    } catch (error: any) {
      console.error('Error fetching funnel stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get daily analytics data for charts
  async getDailyAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const dateFilter = this.buildDateFilter(startDate as string, endDate as string, 'ae');

      const query = `
        SELECT
          DATE(ae.created_at) as date,
          COUNT(DISTINCT ae.session_id) as total_sessions,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'page_view' THEN ae.session_id END) as page_views,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'form_start' THEN ae.session_id END) as form_starts,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'wheel_spin' THEN ae.session_id END) as wheel_spins,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'form_submit' THEN ae.session_id END) as form_submits,
          COUNT(DISTINCT CASE WHEN ass.converted = true THEN ae.session_id END) as conversions
        FROM analytics_events ae
        LEFT JOIN analytics_sessions ass ON ae.session_id = ass.session_id
        ${dateFilter}
        GROUP BY DATE(ae.created_at)
        ORDER BY date DESC
      `;

      const result = await pool.query(query);

      // Convert string values to numbers for Chart.js
      const processedData = result.rows.map(row => ({
        date: row.date,
        total_sessions: parseInt(row.total_sessions) || 0,
        page_views: parseInt(row.page_views) || 0,
        form_starts: parseInt(row.form_starts) || 0,
        wheel_spins: parseInt(row.wheel_spins) || 0,
        form_submits: parseInt(row.form_submits) || 0,
        conversions: parseInt(row.conversions) || 0
      }));

      res.json({
        success: true,
        data: processedData
      });
    } catch (error: any) {
      console.error('Error fetching daily analytics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get traffic sources
  async getTrafficSources(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const dateFilter = this.buildDateFilter(startDate as string, endDate as string);

      const query = `
        SELECT
          COALESCE(utm_source, 'direct') as source,
          COALESCE(utm_medium, 'none') as medium,
          COALESCE(utm_campaign, 'none') as campaign,
          COUNT(*) as sessions,
          COUNT(CASE WHEN converted = true THEN 1 END) as conversions,
          ROUND(
            (COUNT(CASE WHEN converted = true THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100),
            2
          ) as conversion_rate
        FROM analytics_sessions
        ${dateFilter}
        GROUP BY utm_source, utm_medium, utm_campaign
        ORDER BY sessions DESC
      `;

      const result = await pool.query(query);

      // Convert string values to numbers
      const processedData = result.rows.map(row => ({
        source: row.source,
        medium: row.medium,
        campaign: row.campaign,
        sessions: parseInt(row.sessions) || 0,
        conversions: parseInt(row.conversions) || 0,
        conversion_rate: parseFloat(row.conversion_rate) || 0
      }));

      res.json({
        success: true,
        data: processedData
      });
    } catch (error: any) {
      console.error('Error fetching traffic sources:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get device and browser statistics
  async getDeviceStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const dateFilter = this.buildDateFilter(startDate as string, endDate as string);

      const deviceQuery = `
        SELECT
          device_type,
          COUNT(*) as sessions,
          COUNT(CASE WHEN converted = true THEN 1 END) as conversions,
          ROUND(AVG(conversion_time), 0) as avg_conversion_time
        FROM analytics_sessions
        ${dateFilter ? dateFilter + ' AND' : 'WHERE'} device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY sessions DESC
      `;

      const browserQuery = `
        SELECT
          browser,
          COUNT(*) as sessions,
          COUNT(CASE WHEN converted = true THEN 1 END) as conversions
        FROM analytics_sessions
        ${dateFilter ? dateFilter + ' AND' : 'WHERE'} browser IS NOT NULL
        GROUP BY browser
        ORDER BY sessions DESC
        LIMIT 10
      `;

      const [deviceResult, browserResult] = await Promise.all([
        pool.query(deviceQuery),
        pool.query(browserQuery)
      ]);

      // Convert string values to numbers
      const processedDevices = deviceResult.rows.map(row => ({
        device_type: row.device_type,
        sessions: parseInt(row.sessions) || 0,
        conversions: parseInt(row.conversions) || 0,
        avg_conversion_time: parseInt(row.avg_conversion_time) || 0
      }));

      const processedBrowsers = browserResult.rows.map(row => ({
        browser: row.browser,
        sessions: parseInt(row.sessions) || 0,
        conversions: parseInt(row.conversions) || 0
      }));

      res.json({
        success: true,
        data: {
          devices: processedDevices,
          browsers: processedBrowsers
        }
      });
    } catch (error: any) {
      console.error('Error fetching device stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get session details with events
  async getSessionDetails(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const sessionQuery = `
        SELECT * FROM analytics_sessions WHERE session_id = $1
      `;

      const eventsQuery = `
        SELECT * FROM analytics_events
        WHERE session_id = $1
        ORDER BY created_at ASC
      `;

      const [sessionResult, eventsResult] = await Promise.all([
        pool.query(sessionQuery, [sessionId]),
        pool.query(eventsQuery, [sessionId])
      ]);

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        data: {
          session: sessionResult.rows[0],
          events: eventsResult.rows
        }
      });
    } catch (error: any) {
      console.error('Error fetching session details:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get real-time statistics (last 5 minutes)
  async getRealTimeStats(req: Request, res: Response) {
    try {
      const query = `
        SELECT
          COUNT(DISTINCT ae.session_id) as active_sessions,
          COUNT(*) as recent_events,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'page_view' THEN ae.session_id END) as current_visitors,
          COUNT(DISTINCT CASE WHEN ae.event_type = 'form_submit' THEN ae.session_id END) as recent_conversions
        FROM analytics_events ae
        WHERE ae.created_at >= NOW() - INTERVAL '5 minutes'
      `;

      const recentEventsQuery = `
        SELECT
          ae.event_type,
          ae.page_url,
          ae.created_at,
          ass.device_type,
          ass.utm_source
        FROM analytics_events ae
        LEFT JOIN analytics_sessions ass ON ae.session_id = ass.session_id
        WHERE ae.created_at >= NOW() - INTERVAL '30 minutes'
        ORDER BY ae.created_at DESC
        LIMIT 20
      `;

      const [statsResult, eventsResult] = await Promise.all([
        pool.query(query),
        pool.query(recentEventsQuery)
      ]);

      res.json({
        success: true,
        data: {
          stats: statsResult.rows[0],
          recent_events: eventsResult.rows
        }
      });
    } catch (error: any) {
      console.error('Error fetching real-time stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get drop-off analysis
  async getDropOffAnalysis(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const dateFilter = this.buildDateFilter(startDate as string, endDate as string);

      // Calculate drop-offs based on the funnel progression
      // Drop-off = users who reached step N but didn't reach step N+1
      const query = `
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
          ${dateFilter}
          GROUP BY session_id
        ),
        step_counts AS (
          SELECT
            COUNT(*) as total_sessions,
            SUM(visited_landing) as visited_landing,
            SUM(submitted_form) as submitted_form,
            SUM(viewed_wheel) as viewed_wheel,
            SUM(spun_wheel) as spun_wheel,
            SUM(claimed_prize) as claimed_prize,
            SUM(whatsapp_redirect) as whatsapp_redirect
          FROM funnel_data
        )
        SELECT
          GREATEST(0, total_sessions - COALESCE(submitted_form, 0)) as dropped_at_landing,
          GREATEST(0, COALESCE(submitted_form, 0) - COALESCE(viewed_wheel, 0)) as dropped_at_form,
          GREATEST(0, COALESCE(viewed_wheel, 0) - COALESCE(spun_wheel, 0)) as dropped_at_wheel,
          GREATEST(0, COALESCE(spun_wheel, 0) - COALESCE(claimed_prize, 0)) as dropped_at_spin,
          GREATEST(0, COALESCE(claimed_prize, 0) - COALESCE(whatsapp_redirect, 0)) as dropped_at_claim,
          total_sessions
        FROM step_counts
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error fetching drop-off analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Track analytics event (POST endpoint)
  async trackEvent(req: Request, res: Response) {
    try {
      const {
        sessionId,
        eventType,
        eventCategory,
        eventLabel,
        pageUrl,
        pageTitle,
        metadata,
        timeOnPage,
        scrollDepth
      } = req.body;

      // Get client info
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Ensure session exists (auto-create if not exists)
      const sessionCheckQuery = 'SELECT id FROM analytics_sessions WHERE session_id = $1';
      const sessionExists = await pool.query(sessionCheckQuery, [sessionId]);

      if (sessionExists.rows.length === 0) {
        // Auto-create session if it doesn't exist
        const createSessionQuery = `
          INSERT INTO analytics_sessions (
            session_id, landing_page, ip_address, user_agent
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (session_id) DO NOTHING
        `;
        await pool.query(createSessionQuery, [sessionId, pageUrl, ipAddress, userAgent]);
      }

      // Insert event
      const eventQuery = `
        INSERT INTO analytics_events (
          session_id, event_type, event_category, event_label,
          page_url, page_title, metadata, time_on_page, scroll_depth,
          ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `;

      await pool.query(eventQuery, [
        sessionId,
        eventType,
        eventCategory,
        eventLabel,
        pageUrl,
        pageTitle,
        JSON.stringify(metadata || {}),
        timeOnPage,
        scrollDepth,
        ipAddress,
        userAgent
      ]);

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error: any) {
      console.error('Error tracking event:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create or update analytics session
  async createSession(req: Request, res: Response) {
    try {
      const {
        sessionId,
        userFingerprint,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        referrer,
        landingPage,
        browser,
        deviceType,
        os
      } = req.body;

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Check if session exists
      const checkQuery = 'SELECT id FROM analytics_sessions WHERE session_id = $1';
      const checkResult = await pool.query(checkQuery, [sessionId]);

      if (checkResult.rows.length > 0) {
        // Update existing session
        const updateQuery = `
          UPDATE analytics_sessions
          SET last_seen_at = NOW(), updated_at = NOW()
          WHERE session_id = $1
        `;
        await pool.query(updateQuery, [sessionId]);
      } else {
        // Create new session
        const insertQuery = `
          INSERT INTO analytics_sessions (
            session_id, user_fingerprint, utm_source, utm_medium, utm_campaign,
            utm_content, utm_term, referrer, landing_page, ip_address, user_agent,
            browser, device_type, os
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        await pool.query(insertQuery, [
          sessionId,
          userFingerprint,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          referrer,
          landingPage,
          ipAddress,
          userAgent,
          browser,
          deviceType,
          os
        ]);
      }

      res.json({
        success: true,
        message: 'Session created/updated successfully'
      });
    } catch (error: any) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Helper function to build date filter
  private buildDateFilter(startDate?: string, endDate?: string, tableAlias: string = ''): string {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    let filter = '';

    if (startDate || endDate) {
      const conditions: string[] = [];
      if (startDate) {
        // Include entire start date (from 00:00:00)
        conditions.push(`${prefix}created_at >= '${startDate} 00:00:00'::timestamp`);
      }
      if (endDate) {
        // Include entire end date (until 23:59:59)
        conditions.push(`${prefix}created_at <= '${endDate} 23:59:59'::timestamp`);
      }
      filter = 'WHERE ' + conditions.join(' AND ');
    }

    return filter;
  }
}

export const analyticsDetailedController = new AnalyticsDetailedController();
