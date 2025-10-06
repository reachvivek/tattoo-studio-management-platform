import { pool } from "../config/database";
import {
  CreateLeadDto,
  Lead,
  LeadStatus,
  ActivityType,
} from "../models/lead.model";
import { emailService } from "./email.service";

export class LeadService {
  async createLead(
    data: CreateLeadDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<Lead> {
    // Validate only required fields
    if (!data.name || !data.email || !data.whatsappNumber) {
      throw new Error("Alle Pflichtfelder müssen ausgefüllt werden");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Ungültige E-Mail-Adresse");
    }

    // Validate phone number format (10-15 digits)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(data.whatsappNumber)) {
      throw new Error("Ungültige WhatsApp-Nummer");
    }

    // Validate tattoo description length only if provided
    if (data.tattooDescription && data.tattooDescription.length < 10) {
      throw new Error(
        "Tattoo-Beschreibung muss mindestens 10 Zeichen lang sein"
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check for repeat submissions
      const existingLeadsResult = await client.query(
        "SELECT id, name, submission_number FROM leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
        [data.email]
      );
      const isRepeatSubmission = existingLeadsResult.rows.length > 0;

      // Insert lead with optional fields defaulted
      const result = await client.query(
        `INSERT INTO leads (name, email, whatsapp_country_code, whatsapp_number, tattoo_description,
         reference_images, discount_percentage, status, utm_source, utm_medium, utm_campaign, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, 30, 'new', $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          data.name,
          data.email,
          data.whatsappCountryCode || "+49",
          data.whatsappNumber,
          data.tattooDescription || "",
          JSON.stringify(data.referenceImages || []),
          data.utmSource || null,
          data.utmMedium || null,
          data.utmCampaign || null,
          ipAddress || null,
          userAgent || null,
        ]
      );

      const lead = result.rows[0];

      // Create activity
      const activityDescription = isRepeatSubmission
        ? `Wiederholte Anfrage (${
            lead.submission_number || "N/A"
          }. Einreichung) - Vorherige Anfrage: ID ${
            existingLeadsResult.rows[0].id
          }`
        : "Neuer Lead erstellt";

      await client.query(
        `INSERT INTO crm_activities (lead_id, activity_type, description)
         VALUES ($1, $2, $3)`,
        [lead.id, ActivityType.LEAD_CREATED, activityDescription]
      );

      await client.query(
        "UPDATE campaign_stats SET total_leads = total_leads + 1, daily_leads = daily_leads + 1"
      );
      await client.query("COMMIT");

      // Log repeat submissions
      if (isRepeatSubmission) {
        console.log(
          `🔄 Repeat submission from ${data.email} - Submission #${
            lead.submission_number || "N/A"
          }`
        );
      }

      // Send email notifications asynchronously
      Promise.all([
        emailService
          .sendAdminNotification(lead)
          .catch((err) =>
            console.error("Failed to send admin notification:", err)
          ),
        emailService
          .sendUserConfirmation(lead)
          .catch((err) =>
            console.error("Failed to send user confirmation:", err)
          ),
      ]);

      return lead;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getLeads(filters?: any): Promise<Lead[]> {
    const result = await pool.query(
      "SELECT * FROM leads ORDER BY created_at DESC"
    );
    return result.rows;
  }

  async getLeadById(id: number): Promise<Lead | null> {
    const result = await pool.query("SELECT * FROM leads WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  async updateLeadStatus(id: number, status: LeadStatus): Promise<Lead> {
    const result = await pool.query(
      "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
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

  async deleteLead(id: number): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if lead exists
      const leadCheck = await client.query(
        "SELECT id FROM leads WHERE id = $1",
        [id]
      );
      if (leadCheck.rows.length === 0) {
        throw new Error("Lead nicht gefunden");
      }

      // Delete related activities first
      await client.query("DELETE FROM crm_activities WHERE lead_id = $1", [id]);

      // Delete the lead
      await client.query("DELETE FROM leads WHERE id = $1", [id]);

      // Update campaign stats
      await client.query(
        "UPDATE campaign_stats SET total_leads = GREATEST(total_leads - 1, 0)"
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export const leadService = new LeadService();
