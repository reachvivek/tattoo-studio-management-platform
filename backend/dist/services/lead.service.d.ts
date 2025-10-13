import { CreateLeadDto, Lead, LeadStatus } from "../models/lead.model";
export declare class LeadService {
    createLead(data: CreateLeadDto, ipAddress?: string, userAgent?: string): Promise<Lead>;
    getLeads(page?: number, limit?: number, filters?: any): Promise<{
        leads: Lead[];
        total: number;
        page: number;
        totalPages: number;
        statusCounts: {
            new: number;
            contacted: number;
            qualified: number;
            converted: number;
            rejected: number;
        };
    }>;
    getLeadById(id: number): Promise<Lead | null>;
    updateLeadStatus(id: number, status: LeadStatus): Promise<Lead>;
    deleteLead(id: number): Promise<boolean>;
    bulkDeleteLeads(ids: number[]): Promise<{
        deletedCount: number;
        failedIds: number[];
    }>;
}
export declare const leadService: LeadService;
//# sourceMappingURL=lead.service.d.ts.map