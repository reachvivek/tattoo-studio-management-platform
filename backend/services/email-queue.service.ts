import { pool } from '../config/database';
import { Lead } from '../models/lead.model';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailQueueItem {
  id: number;
  lead_id: number;
  email_type: string;
  subject: string;
  template_name: string;
  recipient_email: string;
  recipient_name: string;
  scheduled_at: Date;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  retry_count: number;
  max_retries: number;
  error_message?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class EmailQueueService {
  /**
   * Schedule all 4 follow-up emails for a new lead
   */
  async scheduleFollowUpEmails(lead: Lead): Promise<void> {
    const now = new Date();
    const emails = [
      {
        email_type: 'followup_1',
        subject: 'Tattoo Gutschein',
        template_name: 'followup-1-immediate',
        scheduled_at: new Date(now.getTime() + 1 * 60 * 1000), // 1 minute after lead creation
      },
      {
        email_type: 'followup_2',
        subject: 'Tattoo Gutschein',
        template_name: 'followup-2-8hours',
        scheduled_at: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours
      },
      {
        email_type: 'followup_3',
        subject: 'Tattoo Gutschein',
        template_name: 'followup-3-24hours',
        scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
      },
      {
        email_type: 'followup_4',
        subject: 'Tattoo Überraschung',
        template_name: 'followup-4-3days',
        scheduled_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
    ];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const email of emails) {
        await client.query(
          `INSERT INTO email_queue (lead_id, email_type, subject, template_name,
           recipient_email, recipient_name, scheduled_at, status, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
          [
            lead.id,
            email.email_type,
            email.subject,
            email.template_name,
            lead.email,
            lead.name,
            email.scheduled_at,
            JSON.stringify({
              discount_percentage: lead.discount_percentage,
              lead_id: lead.id,
            }),
          ]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Scheduled 4 follow-up emails for lead #${lead.id} (${lead.email})`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error scheduling follow-up emails:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pending emails that are due to be sent
   */
  async getPendingEmails(): Promise<EmailQueueItem[]> {
    const result = await pool.query(
      `SELECT * FROM email_queue
       WHERE status = 'pending'
       AND scheduled_at <= NOW()
       AND retry_count < max_retries
       ORDER BY scheduled_at ASC
       LIMIT 50`
    );
    return result.rows;
  }

  /**
   * Mark email as sent
   */
  async markEmailSent(emailId: number): Promise<void> {
    await pool.query(
      `UPDATE email_queue
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [emailId]
    );
  }

  /**
   * Mark email as failed and increment retry count
   */
  async markEmailFailed(emailId: number, errorMessage: string): Promise<void> {
    await pool.query(
      `UPDATE email_queue
       SET status = CASE
         WHEN retry_count + 1 >= max_retries THEN 'failed'
         ELSE 'pending'
       END,
       retry_count = retry_count + 1,
       error_message = $2,
       updated_at = NOW()
       WHERE id = $1`,
      [emailId, errorMessage]
    );
  }

  /**
   * Cancel all pending emails for a lead
   */
  async cancelPendingEmailsForLead(leadId: number): Promise<void> {
    await pool.query(
      `UPDATE email_queue
       SET status = 'cancelled', updated_at = NOW()
       WHERE lead_id = $1 AND status = 'pending'`,
      [leadId]
    );
    console.log(`🚫 Cancelled pending emails for lead #${leadId}`);
  }

  /**
   * Get email template content
   */
  getEmailTemplate(templateName: string): string {
    // Try dist/templates first, then ../templates (for development)
    let templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);

    if (!fs.existsSync(templatePath)) {
      // Try from project root/templates
      templatePath = path.join(__dirname, '..', '..', 'templates', `${templateName}.html`);
    }

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templateName} (tried: ${templatePath})`);
    }
    return fs.readFileSync(templatePath, 'utf-8');
  }

  /**
   * Render email template with data
   */
  renderTemplate(template: string, data: any): string {
    let rendered = template;
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key] || '');
    });
    return rendered;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const result = await pool.query(`
      SELECT
        status,
        COUNT(*) as count,
        MIN(scheduled_at) as earliest_scheduled,
        MAX(scheduled_at) as latest_scheduled
      FROM email_queue
      GROUP BY status
    `);
    return result.rows;
  }
}

export const emailQueueService = new EmailQueueService();
