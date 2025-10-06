import { Request, Response } from 'express';
export declare class QueueMonitorController {
    /**
     * Get queue statistics
     */
    getStats(req: Request, res: Response): Promise<void>;
    /**
     * Clean up old queue jobs (not applicable for simple in-memory queue)
     */
    cleanup(req: Request, res: Response): Promise<void>;
}
export declare const queueMonitorController: QueueMonitorController;
//# sourceMappingURL=queue-monitor.controller.d.ts.map