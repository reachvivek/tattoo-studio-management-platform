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
      res.status(500).json({
        success: false,
        error: error.message || 'Fehler beim Erstellen des Leads'
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
}

export const leadController = new LeadController();
