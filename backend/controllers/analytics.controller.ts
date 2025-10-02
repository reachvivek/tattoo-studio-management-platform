import { Request, Response } from 'express';
import { pool } from '../config/database';

export class AnalyticsController {
  async getStats(req: Request, res: Response) {
    try {
      const statsResult = await pool.query('SELECT * FROM campaign_stats LIMIT 1');
      const leadsCountResult = await pool.query('SELECT COUNT(*) as total FROM leads');

      const stats = statsResult.rows[0];
      const totalLeads = parseInt(leadsCountResult.rows[0].total);
      const remainingSlots = 100 - totalLeads;

      res.json({
        success: true,
        data: {
          total_leads: totalLeads,
          daily_leads: stats?.daily_leads || 0,
          remaining_slots: remainingSlots > 0 ? remainingSlots : 0,
          campaign_stats: stats
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
