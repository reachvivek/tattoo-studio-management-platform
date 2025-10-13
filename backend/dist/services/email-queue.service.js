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
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueueService = exports.EmailQueueService = void 0;
const database_1 = require("../config/database");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EmailQueueService {
    /**
     * Schedule all 4 follow-up emails for a new lead
     */
    async scheduleFollowUpEmails(lead) {
        const now = new Date();
        const emails = [
            {
                email_type: 'followup_immediate',
                subject: 'Tattoo Gutschein',
                template_name: 'followup-1-immediate',
                scheduled_at: new Date(now.getTime() + 1 * 60 * 1000), // 1 minute - Confirmation email
            },
            {
                email_type: 'followup_1',
                subject: 'Tattoo Gutschein - Schnell aktivieren!',
                template_name: 'followup-1-1hour',
                scheduled_at: new Date(now.getTime() + 1 * 60 * 60 * 1000), // 1 hour - FIRST follow-up
            },
            {
                email_type: 'followup_2',
                subject: 'Tattoo Gutschein',
                template_name: 'followup-2-8hours',
                scheduled_at: new Date(now.getTime() + 8 * 60 * 60 * 1000), // 8 hours - SECOND follow-up
            },
            {
                email_type: 'followup_3',
                subject: 'Tattoo Gutschein',
                template_name: 'followup-3-24hours',
                scheduled_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours - THIRD follow-up
            },
            {
                email_type: 'followup_4',
                subject: 'Tattoo Überraschung',
                template_name: 'followup-4-3days',
                scheduled_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days - FOURTH follow-up
            },
        ];
        const client = await database_1.pool.connect();
        try {
            await client.query('BEGIN');
            for (const email of emails) {
                await client.query(`INSERT INTO email_queue (lead_id, email_type, subject, template_name,
           recipient_email, recipient_name, scheduled_at, status, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`, [
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
                ]);
            }
            await client.query('COMMIT');
            console.log(`✅ Scheduled 5 emails (1 confirmation + 4 follow-ups) for lead #${lead.id} (${lead.email})`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error scheduling follow-up emails:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Get pending emails that are due to be sent
     */
    async getPendingEmails() {
        const result = await database_1.pool.query(`SELECT * FROM email_queue
       WHERE status = 'pending'
       AND scheduled_at <= NOW()
       AND retry_count < max_retries
       ORDER BY scheduled_at ASC
       LIMIT 50`);
        return result.rows;
    }
    /**
     * Mark email as sent
     */
    async markEmailSent(emailId) {
        await database_1.pool.query(`UPDATE email_queue
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $1`, [emailId]);
    }
    /**
     * Mark email as failed and increment retry count
     */
    async markEmailFailed(emailId, errorMessage) {
        await database_1.pool.query(`UPDATE email_queue
       SET status = CASE
         WHEN retry_count + 1 >= max_retries THEN 'failed'
         ELSE 'pending'
       END,
       retry_count = retry_count + 1,
       error_message = $2,
       updated_at = NOW()
       WHERE id = $1`, [emailId, errorMessage]);
    }
    /**
     * Cancel all pending emails for a lead
     */
    async cancelPendingEmailsForLead(leadId) {
        await database_1.pool.query(`UPDATE email_queue
       SET status = 'cancelled', updated_at = NOW()
       WHERE lead_id = $1 AND status = 'pending'`, [leadId]);
        console.log(`🚫 Cancelled pending emails for lead #${leadId}`);
    }
    /**
     * Get email template content
     */
    getEmailTemplate(templateName) {
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
    renderTemplate(template, data) {
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
    async getQueueStats() {
        const result = await database_1.pool.query(`
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
exports.EmailQueueService = EmailQueueService;
exports.emailQueueService = new EmailQueueService();
//# sourceMappingURL=email-queue.service.js.map