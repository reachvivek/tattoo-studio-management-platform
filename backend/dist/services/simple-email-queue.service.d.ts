export declare class SimpleEmailQueueService {
    private queue;
    private processing;
    private rateLimits;
    private readonly HOURLY_LIMIT;
    private readonly DAILY_LIMIT;
    private readonly DELAY_BETWEEN_SENDS;
    constructor();
    /**
     * Add email to queue
     */
    queueEmail(type: 'user_confirmation' | 'admin_notification', lead: any): Promise<void>;
    /**
     * Start background queue processor
     */
    private startQueueProcessor;
    /**
     * Process queued emails
     */
    private processQueue;
    /**
     * Check and reset rate limits if needed
     */
    private checkAndResetRateLimits;
    /**
     * Reset hourly limit
     */
    private resetHourlyLimit;
    /**
     * Reset daily limit
     */
    private resetDailyLimit;
    /**
     * Schedule daily reset at midnight
     */
    private scheduleDailyRateLimitReset;
    /**
     * Get queue statistics
     */
    getQueueStats(): {
        queue: {
            pending: number;
            processing: boolean;
        };
        rateLimits: {
            hourly: string;
            daily: string;
        };
    };
    /**
     * Helper to delay execution
     */
    private delay;
}
export declare const simpleEmailQueueService: SimpleEmailQueueService;
//# sourceMappingURL=simple-email-queue.service.d.ts.map