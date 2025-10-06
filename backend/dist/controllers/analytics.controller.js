"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsController = exports.AnalyticsController = void 0;
const database_1 = require("../config/database");
class AnalyticsController {
    async getStats(req, res) {
        try {
            const statsResult = await database_1.pool.query('SELECT * FROM campaign_stats LIMIT 1');
            const leadsCountResult = await database_1.pool.query('SELECT COUNT(*) as total FROM leads');
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.analyticsController = new AnalyticsController();
//# sourceMappingURL=analytics.controller.js.map