import { emailQueueService } from './email-queue.service';
import { emailService } from './email.service';

export class EmailProcessorService {
  private isProcessing: boolean = false;

  /**
   * Process pending emails in the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('⏭️  Email processor already running, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('📧 Starting email queue processing...');

    try {
      const pendingEmails = await emailQueueService.getPendingEmails();

      if (pendingEmails.length === 0) {
        console.log('✅ No pending emails to process');
        return;
      }

      console.log(`📬 Found ${pendingEmails.length} pending email(s) to send`);

      for (const email of pendingEmails) {
        try {
          await this.sendEmail(email);
          await emailQueueService.markEmailSent(email.id);
          console.log(`✅ Sent ${email.email_type} to ${email.recipient_email} (Queue ID: ${email.id})`);
        } catch (error: any) {
          console.error(`❌ Failed to send email ${email.id}:`, error.message);
          await emailQueueService.markEmailFailed(email.id, error.message);
        }

        // Small delay between emails to avoid rate limiting
        await this.sleep(1000);
      }

      console.log('✅ Email queue processing completed');
    } catch (error) {
      console.error('❌ Error processing email queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send a single email from the queue
   */
  private async sendEmail(queueItem: any): Promise<void> {
    // Get the template
    const template = emailQueueService.getEmailTemplate(queueItem.template_name);

    // Render the template with lead data
    const htmlContent = emailQueueService.renderTemplate(template, {
      name: queueItem.recipient_name,
      discount: queueItem.metadata?.discount_percentage || 30,
    });

    // Use the existing email service to send
    await emailService.sendFollowUpEmail(
      queueItem.recipient_email,
      queueItem.recipient_name,
      queueItem.subject,
      htmlContent
    );
  }

  /**
   * Start the email processor with interval
   */
  startScheduler(intervalMinutes: number = 5): void {
    console.log(`🚀 Starting email processor scheduler (every ${intervalMinutes} minutes)`);

    // Process immediately on start
    this.processQueue();

    // Then process at regular intervals
    setInterval(() => {
      this.processQueue();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Helper to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const emailProcessorService = new EmailProcessorService();
