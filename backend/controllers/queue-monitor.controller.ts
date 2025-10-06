import { Request, Response } from 'express';
import { simpleEmailQueueService } from '../services/simple-email-queue.service';

export class QueueMonitorController {
  /**
   * Get queue statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = simpleEmailQueueService.getQueueStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
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
  async cleanup(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Simple in-memory queue does not require cleanup',
    });
  }
}

export const queueMonitorController = new QueueMonitorController();
