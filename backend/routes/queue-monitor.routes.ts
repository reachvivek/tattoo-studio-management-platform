import { Router } from 'express';
import { queueMonitorController } from '../controllers/queue-monitor.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All queue monitoring routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics (waiting, active, completed, failed, rate limits)
 * @access  Private (Admin only)
 */
router.get('/stats', queueMonitorController.getStats.bind(queueMonitorController));

/**
 * @route   POST /api/queue/cleanup
 * @desc    Clean up old completed and failed jobs
 * @access  Private (Admin only)
 */
router.post('/cleanup', queueMonitorController.cleanup.bind(queueMonitorController));

export default router;
