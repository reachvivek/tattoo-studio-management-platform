import { pool } from '../config/database';
import { CreateLeadDto, Lead, LeadStatus, ActivityType } from '../models/lead.model';

export class LeadService {
  async createLead(data: CreateLeadDto, ipAddress?: string, userAgent?: string): Promise<Lead> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO leads (name, email, whatsapp_country_code, whatsapp_number, tattoo_description,
         reference_images, discount_percentage, status, utm_source, utm_medium, utm_campaign, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, 30, 'new', $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          data.name,
          data.email,
          data.whatsappCountryCode || '+49',
          data.whatsappNumber,
          data.tattooDescription,
          JSON.stringify(data.referenceImages || []),
          data.utmSource,
          data.utmMedium,
          data.utmCampaign,
          ipAddress,
          userAgent
        ]
      );

      const lead = result.rows[0];

      await client.query(
        `INSERT INTO crm_activities (lead_id, activity_type, description)
         VALUES ($1, $2, $3)`,
        [lead.id, ActivityType.LEAD_CREATED, 'Neuer Lead erstellt']
      );

      await client.query('UPDATE campaign_stats SET total_leads = total_leads + 1, daily_leads = daily_leads + 1');
      await client.query('COMMIT');

      return lead;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getLeads(filters?: any): Promise<Lead[]> {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    return result.rows;
  }

  async getLeadById(id: number): Promise<Lead | null> {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
    const result = await pool.query(
      'UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows[0]) {
      await pool.query(
        `INSERT INTO crm_activities (lead_id, activity_type, description)
         VALUES ($1, $2, $3)`,
        [id, ActivityType.STATUS_CHANGED, `Status geändert zu: ${status}`]
      );
    }

    return result.rows[0];
  }
}

export const leadService = new LeadService();
