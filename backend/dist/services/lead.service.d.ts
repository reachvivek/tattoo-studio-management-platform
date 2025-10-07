import { CreateLeadDto, Lead, LeadStatus } from "../models/lead.model";
export declare class LeadService {
    createLead(data: CreateLeadDto, ipAddress?: string, userAgent?: string): Promise<Lead>;
    getLeads(filters?: any): Promise<Lead[]>;
    getLeadById(id: number): Promise<Lead | null>;
    updateLeadStatus(id: number, status: LeadStatus): Promise<Lead>;
    deleteLead(id: number): Promise<boolean>;
}
export declare const leadService: LeadService;
//# sourceMappingURL=lead.service.d.ts.map