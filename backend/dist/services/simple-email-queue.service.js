"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleEmailQueueService = exports.SimpleEmailQueueService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class SimpleEmailQueueService {
    queue = [];
    processing = false;
    rateLimits;
    HOURLY_LIMIT;
    DAILY_LIMIT;
    DELAY_BETWEEN_SENDS;
    constructor() {
        this.HOURLY_LIMIT = parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '50');
        this.DAILY_LIMIT = parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY || '500');
        this.DELAY_BETWEEN_SENDS = parseInt(process.env.EMAIL_DELAY_BETWEEN_SENDS || '2000');
        const now = new Date();
        this.rateLimits = {
            hourly: {
                count: 0,
                resetTime: new Date(now.getTime() + 3600000)
            },
            daily: {
                count: 0,
                resetTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
            }
        };
        this.startQueueProcessor();
        console.log('✅ Email queue initialized');
    }
    /**
     * Add email to queue
     */
    async queueEmail(type, lead) {
        const job = {
            type,
            lead,
            retries: 0
        };
        this.queue.push(job);
        // Trigger processing if not already running
        if (!this.processing) {
            this.processQueue();
        }
    }
    /**
     * Start background queue processor
     */
    startQueueProcessor() {
        // Check queue every 30 seconds
        setInterval(() => {
            if (this.queue.length > 0 && !this.processing) {
                this.processQueue();
            }
        }, 30000);
        // Reset hourly counter every hour
        setInterval(() => {
            this.resetHourlyLimit();
        }, 3600000);
        // Reset daily counter at midnight
        this.scheduleDailyRateLimitReset();
    }
    /**
     * Process queued emails
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        while (this.queue.length > 0) {
            const job = this.queue[0];
            // Check if job is scheduled for future
            if (job.scheduledFor && job.scheduledFor > new Date()) {
                console.log(`⏰ Next job scheduled for ${job.scheduledFor.toLocaleString()}. Waiting...`);
                break;
            }
            // Check rate limits
            this.checkAndResetRateLimits();
            if (this.rateLimits.hourly.count >= this.HOURLY_LIMIT) {
                console.log(`⏸️  Hourly limit reached (${this.rateLimits.hourly.count}/${this.HOURLY_LIMIT}). Next email at ${this.rateLimits.hourly.resetTime.toLocaleString()}`);
                // Schedule job for next hour
                job.scheduledFor = this.rateLimits.hourly.resetTime;
                break;
            }
            if (this.rateLimits.daily.count >= this.DAILY_LIMIT) {
                console.log(`⏸️  Daily limit reached (${this.rateLimits.daily.count}/${this.DAILY_LIMIT}). Next email tomorrow at ${this.rateLimits.daily.resetTime.toLocaleString()}`);
                // Schedule job for tomorrow
                job.scheduledFor = this.rateLimits.daily.resetTime;
                break;
            }
            // Remove job from queue
            this.queue.shift();
            // Send email
            try {
                console.log(`📬 [QUEUE] Processing ${job.type} for Lead #${job.lead.id}`);
                console.log(`📬 [QUEUE] Rate limits - Hourly: ${this.rateLimits.hourly.count}/${this.HOURLY_LIMIT}, Daily: ${this.rateLimits.daily.count}/${this.DAILY_LIMIT}`);
                const { emailService } = await Promise.resolve().then(() => __importStar(require('./email.service')));
                if (job.type === 'user_confirmation') {
                    await emailService.sendUserConfirmationEmail(job.lead);
                }
                else if (job.type === 'admin_notification') {
                    await emailService.sendAdminNotificationEmail(job.lead);
                }
                this.rateLimits.hourly.count++;
                this.rateLimits.daily.count++;
                console.log(`✅ [QUEUE] Email sent successfully. New counts - Hourly: ${this.rateLimits.hourly.count}/${this.HOURLY_LIMIT}, Daily: ${this.rateLimits.daily.count}/${this.DAILY_LIMIT}`);
                if (this.queue.length > 0) {
                    console.log(`⏱️  [QUEUE] Waiting ${this.DELAY_BETWEEN_SENDS}ms before next email...`);
                    await this.delay(this.DELAY_BETWEEN_SENDS);
                }
            }
            catch (error) {
                console.error(`❌ [QUEUE] Failed to send ${job.type} for Lead #${job.lead.id}`);
                console.error(`❌ [QUEUE] Error: ${error.message}`);
                console.error(`❌ [QUEUE] Error Code: ${error.code}`);
                job.retries++;
                if (job.retries < 3) {
                    console.log(`🔄 [QUEUE] Retry ${job.retries}/3 - Re-queuing job`);
                    this.queue.push(job);
                }
                else {
                    console.error(`❌ [QUEUE] Max retries reached. Discarding email for Lead #${job.lead.id}`);
                }
            }
        }
        this.processing = false;
    }
    /**
     * Check and reset rate limits if needed
     */
    checkAndResetRateLimits() {
        const now = new Date();
        // Reset hourly if time has passed
        if (now >= this.rateLimits.hourly.resetTime) {
            this.resetHourlyLimit();
        }
        // Reset daily if time has passed
        if (now >= this.rateLimits.daily.resetTime) {
            this.resetDailyLimit();
        }
    }
    /**
     * Reset hourly limit
     */
    resetHourlyLimit() {
        const now = new Date();
        this.rateLimits.hourly = {
            count: 0,
            resetTime: new Date(now.getTime() + 3600000)
        };
        console.log(`🔄 Hourly rate limit reset. Next reset: ${this.rateLimits.hourly.resetTime.toLocaleString()}`);
        // Trigger queue processing if there are pending jobs
        if (this.queue.length > 0 && !this.processing) {
            this.processQueue();
        }
    }
    /**
     * Reset daily limit
     */
    resetDailyLimit() {
        const now = new Date();
        this.rateLimits.daily = {
            count: 0,
            resetTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
        };
        console.log(`🔄 Daily rate limit reset. Next reset: ${this.rateLimits.daily.resetTime.toLocaleString()}`);
        // Trigger queue processing if there are pending jobs
        if (this.queue.length > 0 && !this.processing) {
            this.processQueue();
        }
    }
    /**
     * Schedule daily reset at midnight
     */
    scheduleDailyRateLimitReset() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        setTimeout(() => {
            this.resetDailyLimit();
            // Schedule next daily reset (recursive)
            this.scheduleDailyRateLimitReset();
        }, msUntilMidnight);
    }
    /**
     * Get queue statistics
     */
    getQueueStats() {
        return {
            queue: {
                pending: this.queue.length,
                processing: this.processing
            },
            rateLimits: {
                hourly: `${this.rateLimits.hourly.count}/${this.HOURLY_LIMIT} (resets ${this.rateLimits.hourly.resetTime.toLocaleTimeString()})`,
                daily: `${this.rateLimits.daily.count}/${this.DAILY_LIMIT} (resets ${this.rateLimits.daily.resetTime.toLocaleString()})`
            }
        };
    }
    /**
     * Helper to delay execution
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.SimpleEmailQueueService = SimpleEmailQueueService;
exports.simpleEmailQueueService = new SimpleEmailQueueService();
//# sourceMappingURL=simple-email-queue.service.js.map