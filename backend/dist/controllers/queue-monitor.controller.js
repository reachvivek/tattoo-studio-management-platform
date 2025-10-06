"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueMonitorController = exports.QueueMonitorController = void 0;
const simple_email_queue_service_1 = require("../services/simple-email-queue.service");
class QueueMonitorController {
    /**
     * Get queue statistics
     */
    async getStats(req, res) {
        try {
            const stats = simple_email_queue_service_1.simpleEmailQueueService.getQueueStats();
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error('Error fetching queue stats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch queue statistics',
            });
        }
    }
    /**
     * Clean up old queue jobs (not applicable for simple in-memory queue)
     */
    async cleanup(req, res) {
        res.json({
            success: true,
            message: 'Simple in-memory queue does not require cleanup',
        });
    }
}
exports.QueueMonitorController = QueueMonitorController;
exports.queueMonitorController = new QueueMonitorController();
//# sourceMappingURL=queue-monitor.controller.js.map