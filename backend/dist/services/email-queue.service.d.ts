import { Lead } from '../models/lead.model';
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
export declare class EmailQueueService {
    /**
     * Schedule all 4 follow-up emails for a new lead
     */
    scheduleFollowUpEmails(lead: Lead): Promise<void>;
    /**
     * Get pending emails that are due to be sent
     */
    getPendingEmails(): Promise<EmailQueueItem[]>;
    /**
     * Mark email as sent
     */
    markEmailSent(emailId: number): Promise<void>;
    /**
     * Mark email as failed and increment retry count
     */
    markEmailFailed(emailId: number, errorMessage: string): Promise<void>;
    /**
     * Cancel all pending emails for a lead
     */
    cancelPendingEmailsForLead(leadId: number): Promise<void>;
    /**
     * Get email template content
     */
    getEmailTemplate(templateName: string): string;
    /**
     * Render email template with data
     */
    renderTemplate(template: string, data: any): string;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<any>;
}
export declare const emailQueueService: EmailQueueService;
//# sourceMappingURL=email-queue.service.d.ts.map