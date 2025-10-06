"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadController = exports.LeadController = void 0;
const lead_service_1 = require("../services/lead.service");
class LeadController {
    async create(req, res) {
        try {
            const data = req.body;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');
            const lead = await lead_service_1.leadService.createLead(data, ipAddress, userAgent);
            res.status(201).json({
                success: true,
                message: 'Lead erfolgreich erstellt',
                data: lead
            });
        }
        catch (error) {
            console.error('❌ Error creating lead:', error);
            // Handle validation errors with 400 Bad Request
            if (error.message && (error.message.includes('Pflichtfelder') ||
                error.message.includes('Ungültige') ||
                error.message.includes('mindestens'))) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            // Handle database errors gracefully - don't expose technical details
            if (error.code) {
                console.error('Database error code:', error.code);
                return res.status(500).json({
                    success: false,
                    error: 'Ein technischer Fehler ist aufgetreten. Bitte versuche es später erneut.'
                });
            }
            // Generic error response
            res.status(500).json({
                success: false,
                error: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.'
            });
        }
    }
    async getAll(req, res) {
        try {
            const leads = await lead_service_1.leadService.getLeads();
            res.json({
                success: true,
                data: leads
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async getById(req, res) {
        try {
            const lead = await lead_service_1.leadService.getLeadById(parseInt(req.params.id));
            if (!lead) {
                return res.status(404).json({
                    success: false,
                    error: 'Lead nicht gefunden'
                });
            }
            res.json({
                success: true,
                data: lead
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            const lead = await lead_service_1.leadService.updateLeadStatus(parseInt(req.params.id), status);
            res.json({
                success: true,
                message: 'Status aktualisiert',
                data: lead
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            await lead_service_1.leadService.deleteLead(id);
            res.json({
                success: true,
                message: 'Lead erfolgreich gelöscht'
            });
        }
        catch (error) {
            if (error.message === 'Lead nicht gefunden') {
                return res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.LeadController = LeadController;
exports.leadController = new LeadController();
//# sourceMappingURL=lead.controller.js.map