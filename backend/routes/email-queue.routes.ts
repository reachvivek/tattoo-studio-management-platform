import { Router, Request, Response } from 'express';
import { emailQueueService } from '../services/email-queue.service';
import { emailProcessorService } from '../services/email-processor.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/email-queue/stats
 * @desc    Get email queue statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await emailQueueService.getQueueStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/email-queue/process
 * @desc    Manually trigger email queue processing
 * @access  Private (Admin only)
 */
router.post('/process', authenticateToken, async (req: Request, res: Response) => {
  try {
    await emailProcessorService.processQueue();
    res.json({
      success: true,
      message: 'Email queue processing completed',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/email-queue/pending
 * @desc    Get pending emails
 * @access  Private (Admin only)
 */
router.get('/pending', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pendingEmails = await emailQueueService.getPendingEmails();
    res.json({
      success: true,
      data: pendingEmails,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
