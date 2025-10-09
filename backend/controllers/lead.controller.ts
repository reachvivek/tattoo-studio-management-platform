import { Request, Response } from 'express';
import { leadService } from '../services/lead.service';
import { CreateLeadDto } from '../models/lead.model';

export class LeadController {
  async create(req: Request, res: Response) {
    try {
      const data: CreateLeadDto = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const lead = await leadService.createLead(data, ipAddress, userAgent);

      res.status(201).json({
        success: true,
        message: 'Lead erfolgreich erstellt',
        data: lead
      });
    } catch (error: any) {
      console.error('❌ Error creating lead:', error);

      // Handle validation errors with 400 Bad Request
      if (error.message && (
        error.message.includes('Pflichtfelder') ||
        error.message.includes('Ungültige') ||
        error.message.includes('mindestens')
      )) {
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

  async getAll(req: Request, res: Response) {
    try {
      const leads = await leadService.getLeads();
      res.json({
        success: true,
        data: leads
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const lead = await leadService.getLeadById(parseInt(req.params.id));
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const lead = await leadService.updateLeadStatus(parseInt(req.params.id), status);
      res.json({
        success: true,
        message: 'Status aktualisiert',
        data: lead
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await leadService.deleteLead(id);
      res.json({
        success: true,
        message: 'Lead erfolgreich gelöscht'
      });
    } catch (error: any) {
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

  async bulkDelete(req: Request, res: Response) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Keine IDs zum Löschen angegeben'
        });
      }

      const result = await leadService.bulkDeleteLeads(ids);

      res.json({
        success: true,
        message: `${result.deletedCount} Lead(s) erfolgreich gelöscht`,
        data: {
          deletedCount: result.deletedCount,
          failedIds: result.failedIds
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const leadController = new LeadController();
