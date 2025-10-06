import dotenv from 'dotenv';

dotenv.config();

interface EmailJob {
  type: 'user_confirmation' | 'admin_notification';
  lead: any;
  retries: number;
  scheduledFor?: Date;
}

interface RateLimitTracker {
  hourly: { count: number; resetTime: Date };
  daily: { count: number; resetTime: Date };
}

export class SimpleEmailQueueService {
  private queue: EmailJob[] = [];
  private processing: boolean = false;
  private rateLimits: RateLimitTracker;
  private readonly HOURLY_LIMIT: number;
  private readonly DAILY_LIMIT: number;
  private readonly DELAY_BETWEEN_SENDS: number;

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
  async queueEmail(type: 'user_confirmation' | 'admin_notification', lead: any): Promise<void> {
    const job: EmailJob = {
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
  private startQueueProcessor() {
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
  private async processQueue() {
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

        const { emailService } = await import('./email.service');

        if (job.type === 'user_confirmation') {
          await emailService.sendUserConfirmationEmail(job.lead);
        } else if (job.type === 'admin_notification') {
          await emailService.sendAdminNotificationEmail(job.lead);
        }

        this.rateLimits.hourly.count++;
        this.rateLimits.daily.count++;

        console.log(`✅ [QUEUE] Email sent successfully. New counts - Hourly: ${this.rateLimits.hourly.count}/${this.HOURLY_LIMIT}, Daily: ${this.rateLimits.daily.count}/${this.DAILY_LIMIT}`);

        if (this.queue.length > 0) {
          console.log(`⏱️  [QUEUE] Waiting ${this.DELAY_BETWEEN_SENDS}ms before next email...`);
          await this.delay(this.DELAY_BETWEEN_SENDS);
        }
      } catch (error: any) {
        console.error(`❌ [QUEUE] Failed to send ${job.type} for Lead #${job.lead.id}`);
        console.error(`❌ [QUEUE] Error: ${error.message}`);
        console.error(`❌ [QUEUE] Error Code: ${error.code}`);

        job.retries++;
        if (job.retries < 3) {
          console.log(`🔄 [QUEUE] Retry ${job.retries}/3 - Re-queuing job`);
          this.queue.push(job);
        } else {
          console.error(`❌ [QUEUE] Max retries reached. Discarding email for Lead #${job.lead.id}`);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Check and reset rate limits if needed
   */
  private checkAndResetRateLimits() {
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
  private resetHourlyLimit() {
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
  private resetDailyLimit() {
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
  private scheduleDailyRateLimitReset() {
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
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const simpleEmailQueueService = new SimpleEmailQueueService();
