interface Lead {
    id: number;
    name: string;
    email: string;
    whatsapp_country_code: string;
    whatsapp_number: string;
    tattoo_description: string;
    reference_images: string | string[];
    discount_percentage: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    created_at: Date;
}
export declare class EmailService {
    private transporter;
    constructor();
    private prepareImageAttachments;
    verifyConnection(): Promise<boolean>;
    sendTestEmail(to: string): Promise<void>;
    sendWelcomeEmail(to: string, name: string): Promise<void>;
    /**
     * Queue admin notification email (public API)
     */
    sendAdminNotification(lead: Lead): Promise<void>;
    /**
     * Actually send admin notification email (called by queue processor)
     * Public method for queue service
     */
    sendAdminNotificationEmail(lead: Lead): Promise<void>;
    /**
     * Queue user confirmation email (public API)
     */
    sendUserConfirmation(lead: Lead): Promise<void>;
    /**
     * Actually send user confirmation email (called by queue processor)
     * Public method for queue service
     */
    sendUserConfirmationEmail(lead: Lead): Promise<void>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=email.service.d.ts.map