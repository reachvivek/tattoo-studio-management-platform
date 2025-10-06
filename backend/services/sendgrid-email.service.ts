import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { simpleEmailQueueService } from './simple-email-queue.service';

dotenv.config();

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

export class SendGridEmailService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY missing in .env file');
      return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid email service initialized');
  }

  /**
   * Queue admin notification email (public API)
   */
  async sendAdminNotification(lead: Lead): Promise<void> {
    await simpleEmailQueueService.queueEmail('admin_notification', lead);
  }

  /**
   * Actually send admin notification email (called by queue processor)
   */
  async sendAdminNotificationEmail(lead: Lead): Promise<void> {
    const images = Array.isArray(lead.reference_images)
      ? lead.reference_images
      : JSON.parse(lead.reference_images as any || '[]');

    const msg = {
      to: 'bookinktermine@gmail.com',
      from: process.env.EMAIL_FROM || 'noreply.bookink@gmail.com',
      subject: `Neue Anfrage: ${lead.name} - BookInk`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">Neue Tattoo-Anfrage</h2>

          <p><strong>Kundeninformationen:</strong></p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; width: 150px;"><strong>Name:</strong></td>
              <td style="padding: 8px 0;">${lead.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;"><strong>E-Mail:</strong></td>
              <td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #000; text-decoration: underline;">${lead.email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;"><strong>WhatsApp:</strong></td>
              <td style="padding: 8px 0;"><a href="https://wa.me/${lead.whatsapp_country_code.replace('+', '')}${lead.whatsapp_number}" style="color: #000; text-decoration: underline;">${lead.whatsapp_country_code} ${lead.whatsapp_number}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;"><strong>Rabatt:</strong></td>
              <td style="padding: 8px 0;">${lead.discount_percentage}%</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;"><strong>Bilder:</strong></td>
              <td style="padding: 8px 0;">${images.length} hochgeladen</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0;"><strong>Eingereicht:</strong></td>
              <td style="padding: 8px 0;">${new Date(lead.created_at).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })}</td>
            </tr>
          </table>

          <p><strong>Tattoo-Beschreibung:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-left: 3px solid #000; margin: 10px 0;">
            ${lead.tattoo_description}
          </div>

          ${images.length > 0 ? `
            <p><strong>📎 Referenzbilder (${images.length}):</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${images.map((img: string) => `
                <a href="${img}" target="_blank" style="display: block;">
                  <img src="${img}" alt="Referenzbild" style="width: 150px; height: 150px; object-fit: cover; border: 2px solid #ddd; border-radius: 5px;">
                </a>
              `).join('')}
            </div>
          ` : ''}

          ${lead.utm_source ? `
            <p><strong>Kampagnen-Tracking:</strong></p>
            <p style="font-size: 14px; color: #666;">Quelle: ${lead.utm_source}${lead.utm_medium ? ' | Medium: ' + lead.utm_medium : ''}${lead.utm_campaign ? ' | Kampagne: ' + lead.utm_campaign : ''}</p>
          ` : ''}

          <p><strong>Schnellaktionen:</strong></p>
          <p>
            <a href="https://gratis-tattoo.vercel.app/admin/leads/${lead.id}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; margin-right: 10px; margin-bottom: 10px; border-radius: 5px;">📊 Lead im CRM ansehen</a>
            <a href="mailto:${lead.email}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; margin-right: 10px; margin-bottom: 10px; border-radius: 5px;">✉️ Per E-Mail antworten</a>
            <a href="https://wa.me/${lead.whatsapp_country_code.replace('+', '')}${lead.whatsapp_number}" style="display: inline-block; background: #25D366; color: #fff; padding: 10px 20px; text-decoration: none; margin-bottom: 10px; border-radius: 5px;">💬 WhatsApp</a>
          </p>

          <div style="background: #f0f9ff; padding: 15px; border-left: 3px solid #000; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">🎯 CRM Dashboard:</p>
            <p style="margin: 5px 0 0 0;">
              <a href="https://gratis-tattoo.vercel.app/admin/dashboard" style="color: #000; text-decoration: underline;">Alle Leads anzeigen →</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">BookInk Lead Management System - Automatische Benachrichtigung</p>
        </div>
      `
    };

    try {
      console.log(`📧 [SENDGRID] Sending admin notification for Lead #${lead.id}`);
      console.log(`📧 [SENDGRID] From: ${msg.from}`);
      console.log(`📧 [SENDGRID] To: ${msg.to}`);

      await sgMail.send(msg);

      console.log(`✅ [SENDGRID] Admin email sent successfully for Lead #${lead.id}`);
    } catch (error: any) {
      console.error(`❌ [SENDGRID] Failed to send admin email for Lead #${lead.id}`);
      console.error(`❌ [SENDGRID] Error: ${error.message}`);
      if (error.response) {
        console.error(`❌ [SENDGRID] Response: ${JSON.stringify(error.response.body)}`);
      }
      throw error;
    }
  }

  /**
   * Queue user confirmation email (public API)
   */
  async sendUserConfirmation(lead: Lead): Promise<void> {
    await simpleEmailQueueService.queueEmail('user_confirmation', lead);
  }

  /**
   * Actually send user confirmation email (called by queue processor)
   */
  async sendUserConfirmationEmail(lead: Lead): Promise<void> {
    const images = Array.isArray(lead.reference_images)
      ? lead.reference_images
      : JSON.parse(lead.reference_images as any || '[]');

    const msg = {
      to: lead.email,
      from: process.env.EMAIL_FROM || 'noreply.bookink@gmail.com',
      subject: `Anfrage Bestätigung - BookInk`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <p>Hallo ${lead.name},</p>

          <p>Vielen Dank für deine Tattoo-Anfrage. Wir haben deine Anfrage erhalten und unser Team wird sie in Kürze prüfen.</p>

          <p><strong>Deine Anfrage:</strong></p>
          <p>${lead.tattoo_description}</p>

          ${images.length > 0 ? `
            <p><strong>📎 Deine Referenzbilder:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0;">
              ${images.map((img: string) => `
                <a href="${img}" target="_blank">
                  <img src="${img}" alt="Referenzbild" style="width: 120px; height: 120px; object-fit: cover; border: 2px solid #ddd; border-radius: 5px;">
                </a>
              `).join('')}
            </div>
          ` : ''}

          <p><strong>Nächste Schritte:</strong></p>
          <ul>
            <li>Unsere Künstler werden deine Beschreibung und Referenzbilder prüfen</li>
            <li>Wir werden dich innerhalb von 24-48 Stunden per E-Mail oder WhatsApp kontaktieren</li>
            <li>Wir besprechen dann dein Design, Preise und verfügbare Termine</li>
          </ul>

          <p><strong>Deine Kontaktinformationen:</strong><br>
          E-Mail: ${lead.email}<br>
          WhatsApp: ${lead.whatsapp_country_code} ${lead.whatsapp_number}</p>

          <p>Bei Fragen kannst du dich gerne jederzeit bei uns melden:</p>
          <p>E-Mail: bookinktermine@gmail.com<br>
          WhatsApp: https://wa.me/491516439197</p>

          <p>Beste Grüße,<br>
          Dein BookInk Team</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Dies ist eine automatische Bestätigung. Bitte bewahre diese E-Mail für deine Unterlagen auf.</p>
        </div>
      `
    };

    try {
      console.log(`📧 [SENDGRID] Sending user confirmation to ${lead.email}`);

      await sgMail.send(msg);

      console.log(`✅ [SENDGRID] Confirmation sent successfully to ${lead.email}`);
    } catch (error: any) {
      console.error(`❌ [SENDGRID] Failed to send confirmation to ${lead.email}`);
      console.error(`❌ [SENDGRID] Error: ${error.message}`);
      if (error.response) {
        console.error(`❌ [SENDGRID] Response: ${JSON.stringify(error.response.body)}`);
      }
      throw error;
    }
  }
}

export const sendGridEmailService = new SendGridEmailService();
