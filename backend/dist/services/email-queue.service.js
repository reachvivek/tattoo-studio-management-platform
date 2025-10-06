"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueueService = exports.EmailQueueService = void 0;
const bull_1 = __importDefault(require("bull"));
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class EmailQueueService {
    emailQueue;
    redis;
    RATE_LIMIT_HOURLY;
    RATE_LIMIT_DAILY;
    DELAY_BETWEEN_SENDS;
    constructor() {
        console.log('\n📬 ========================================');
        console.log('   Email Queue Service Initialization');
        console.log('========================================');
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379');
        this.RATE_LIMIT_HOURLY = parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '50');
        this.RATE_LIMIT_DAILY = parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY || '500');
        this.DELAY_BETWEEN_SENDS = parseInt(process.env.EMAIL_DELAY_BETWEEN_SENDS || '2000');
        console.log('Redis Host:', redisHost);
        console.log('Redis Port:', redisPort);
        console.log('Rate Limit (Hourly):', this.RATE_LIMIT_HOURLY);
        console.log('Rate Limit (Daily):', this.RATE_LIMIT_DAILY);
        console.log('Delay Between Sends:', this.DELAY_BETWEEN_SENDS, 'ms');
        // Initialize Redis client for rate limiting
        this.redis = new ioredis_1.default({
            host: redisHost,
            port: redisPort,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        // Initialize Bull queue
        this.emailQueue = new bull_1.default('email-queue', {
            redis: {
                host: redisHost,
                port: redisPort,
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: 100, // Keep last 100 completed jobs
                removeOnFail: 200, // Keep last 200 failed jobs
            },
        });
        this.setupQueueProcessing();
        this.setupQueueEventHandlers();
        console.log('✅ Email queue initialized');
        console.log('========================================\n');
    }
    setupQueueProcessing() {
        // Process email jobs with rate limiting
        this.emailQueue.process(async (job) => {
            const { type, lead } = job.data;
            console.log(`\n📨 Processing email job #${job.id} (${type}) for Lead #${lead.id}`);
            // Check rate limits
            const canSend = await this.checkRateLimits();
            if (!canSend) {
                const delayUntilTomorrow = this.getDelayUntilTomorrow();
                console.log(`⏸️  Rate limit exceeded. Job will be retried (${delayUntilTomorrow}ms)`);
                // Throw error to trigger retry with exponential backoff
                throw new Error('Rate limit exceeded - will retry later');
            }
            // Add delay between sends to prevent spam detection
            if (job.id && parseInt(job.id.toString()) > 1) {
                console.log(`⏱️  Waiting ${this.DELAY_BETWEEN_SENDS}ms before sending...`);
                await this.delay(this.DELAY_BETWEEN_SENDS);
            }
            // Increment rate limit counters
            await this.incrementRateLimitCounters();
            // Return job data for processing by email service
            return { type, lead };
        });
    }
    setupQueueEventHandlers() {
        this.emailQueue.on('completed', (job, result) => {
            console.log(`✅ Email job #${job.id} completed successfully`);
        });
        this.emailQueue.on('failed', (job, err) => {
            console.error(`❌ Email job #${job?.id} failed:`, err.message);
        });
        this.emailQueue.on('stalled', (job) => {
            console.warn(`⚠️  Email job #${job.id} stalled`);
        });
        this.emailQueue.on('active', (job) => {
            console.log(`🔄 Email job #${job.id} is now active`);
        });
    }
    /**
     * Add email to queue
     */
    async queueEmail(type, lead, priority = 5) {
        const stats = await this.getRateLimitStats();
        console.log(`\n📬 Queueing ${type} email for Lead #${lead.id}`);
        console.log(`Current email counts - Hourly: ${stats.hourly}/${this.RATE_LIMIT_HOURLY}, Daily: ${stats.daily}/${this.RATE_LIMIT_DAILY}`);
        const job = await this.emailQueue.add({ type, lead, priority }, {
            priority, // Lower number = higher priority
            delay: 0, // Process immediately if rate limits allow
        });
        console.log(`✅ Email job #${job.id} queued (Priority: ${priority})`);
    }
    /**
     * Check if we're within rate limits
     */
    async checkRateLimits() {
        const stats = await this.getRateLimitStats();
        if (stats.hourly >= this.RATE_LIMIT_HOURLY) {
            console.log(`⚠️  Hourly rate limit reached: ${stats.hourly}/${this.RATE_LIMIT_HOURLY}`);
            return false;
        }
        if (stats.daily >= this.RATE_LIMIT_DAILY) {
            console.log(`⚠️  Daily rate limit reached: ${stats.daily}/${this.RATE_LIMIT_DAILY}`);
            return false;
        }
        return true;
    }
    /**
     * Get current rate limit statistics
     */
    async getRateLimitStats() {
        const now = new Date();
        const hourKey = `email:rate:hour:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
        const dayKey = `email:rate:day:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        const [hourly, daily] = await Promise.all([
            this.redis.get(hourKey),
            this.redis.get(dayKey),
        ]);
        return {
            hourly: parseInt(hourly || '0'),
            daily: parseInt(daily || '0'),
            lastResetHour: now,
            lastResetDay: now,
        };
    }
    /**
     * Increment rate limit counters
     */
    async incrementRateLimitCounters() {
        const now = new Date();
        const hourKey = `email:rate:hour:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
        const dayKey = `email:rate:day:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        await Promise.all([
            this.redis.incr(hourKey),
            this.redis.incr(dayKey),
            this.redis.expire(hourKey, 3600), // Expire in 1 hour
            this.redis.expire(dayKey, 86400), // Expire in 24 hours
        ]);
    }
    /**
     * Calculate delay until tomorrow midnight
     */
    getDelayUntilTomorrow() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        return tomorrow.getTime() - now.getTime();
    }
    /**
     * Helper to delay execution
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get queue statistics
     */
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.emailQueue.getWaitingCount(),
            this.emailQueue.getActiveCount(),
            this.emailQueue.getCompletedCount(),
            this.emailQueue.getFailedCount(),
            this.emailQueue.getDelayedCount(),
        ]);
        const rateLimitStats = await this.getRateLimitStats();
        return {
            queue: {
                waiting,
                active,
                completed,
                failed,
                delayed,
            },
            rateLimits: {
                hourly: `${rateLimitStats.hourly}/${this.RATE_LIMIT_HOURLY}`,
                daily: `${rateLimitStats.daily}/${this.RATE_LIMIT_DAILY}`,
            },
        };
    }
    /**
     * Get the Bull queue instance (for processing by email service)
     */
    getQueue() {
        return this.emailQueue;
    }
    /**
     * Clean up old jobs
     */
    async cleanup() {
        await this.emailQueue.clean(3600000, 'completed'); // Clean completed jobs older than 1 hour
        await this.emailQueue.clean(86400000, 'failed'); // Clean failed jobs older than 24 hours
        console.log('✅ Queue cleanup completed');
    }
    /**
     * Close connections
     */
    async close() {
        await this.emailQueue.close();
        this.redis.disconnect();
        console.log('✅ Email queue service closed');
    }
}
exports.EmailQueueService = EmailQueueService;
exports.emailQueueService = new EmailQueueService();
//# sourceMappingURL=email-queue.service.js.map