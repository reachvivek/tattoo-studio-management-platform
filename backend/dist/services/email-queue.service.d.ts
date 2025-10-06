import { Queue } from 'bull';
interface EmailJob {
    type: 'user_confirmation' | 'admin_notification';
    lead: any;
    priority?: number;
}
export declare class EmailQueueService {
    private emailQueue;
    private redis;
    private readonly RATE_LIMIT_HOURLY;
    private readonly RATE_LIMIT_DAILY;
    private readonly DELAY_BETWEEN_SENDS;
    constructor();
    private setupQueueProcessing;
    private setupQueueEventHandlers;
    /**
     * Add email to queue
     */
    queueEmail(type: 'user_confirmation' | 'admin_notification', lead: any, priority?: number): Promise<void>;
    /**
     * Check if we're within rate limits
     */
    private checkRateLimits;
    /**
     * Get current rate limit statistics
     */
    private getRateLimitStats;
    /**
     * Increment rate limit counters
     */
    private incrementRateLimitCounters;
    /**
     * Calculate delay until tomorrow midnight
     */
    private getDelayUntilTomorrow;
    /**
     * Helper to delay execution
     */
    private delay;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<{
        queue: {
            waiting: any;
            active: any;
            completed: any;
            failed: any;
            delayed: any;
        };
        rateLimits: {
            hourly: string;
            daily: string;
        };
    }>;
    /**
     * Get the Bull queue instance (for processing by email service)
     */
    getQueue(): Queue<EmailJob>;
    /**
     * Clean up old jobs
     */
    cleanup(): Promise<void>;
    /**
     * Close connections
     */
    close(): Promise<void>;
}
export declare const emailQueueService: EmailQueueService;
export {};
//# sourceMappingURL=email-queue.service.d.ts.map