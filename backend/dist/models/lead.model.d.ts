export interface Lead {
    id: number;
    name: string;
    email: string;
    whatsapp_country_code: string;
    whatsapp_number: string;
    tattoo_description: string;
    reference_images: string[];
    discount_percentage: number;
    whatsapp_sent: boolean;
    email_sent: boolean;
    status: LeadStatus;
    lead_source?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
    updated_at: Date;
}
export declare enum LeadStatus {
    NEW = "new",
    CONTACTED = "contacted",
    QUALIFIED = "qualified",
    CONVERTED = "converted",
    REJECTED = "rejected"
}
export interface CreateLeadDto {
    name: string;
    email: string;
    whatsappCountryCode?: string;
    whatsappNumber: string;
    tattooDescription: string;
    referenceImages?: string[];
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}
export interface CrmNote {
    id: number;
    lead_id: number;
    admin_user_id?: number;
    note_text: string;
    created_at: Date;
}
export interface CrmActivity {
    id: number;
    lead_id: number;
    activity_type: ActivityType;
    description?: string;
    metadata?: any;
    created_at: Date;
}
export declare enum ActivityType {
    EMAIL_SENT = "email_sent",
    WHATSAPP_SENT = "whatsapp_sent",
    STATUS_CHANGED = "status_changed",
    NOTE_ADDED = "note_added",
    LEAD_CREATED = "lead_created"
}
//# sourceMappingURL=lead.model.d.ts.map