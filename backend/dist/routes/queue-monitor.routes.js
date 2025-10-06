"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const queue_monitor_controller_1 = require("../controllers/queue-monitor.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All queue monitoring routes require authentication
router.use(auth_1.authenticateToken);
/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics (waiting, active, completed, failed, rate limits)
 * @access  Private (Admin only)
 */
router.get('/stats', queue_monitor_controller_1.queueMonitorController.getStats.bind(queue_monitor_controller_1.queueMonitorController));
/**
 * @route   POST /api/queue/cleanup
 * @desc    Clean up old completed and failed jobs
 * @access  Private (Admin only)
 */
router.post('/cleanup', queue_monitor_controller_1.queueMonitorController.cleanup.bind(queue_monitor_controller_1.queueMonitorController));
exports.default = router;
//# sourceMappingURL=queue-monitor.routes.js.map