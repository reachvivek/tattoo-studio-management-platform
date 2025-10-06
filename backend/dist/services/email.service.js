"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const simple_email_queue_service_1 = require("./simple-email-queue.service");
dotenv_1.default.config();
class EmailService {
    transporter;
    constructor() {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('❌ Email configuration missing in .env file');
        }
        this.transporter = nodemailer_1.default.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD?.replace(/\s/g, ''),
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        console.log('✅ Email service initialized');
    }
    // Helper method to prepare image attachments
    prepareImageAttachments(images) {
        const attachments = [];
        const uploadsDir = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
        for (const imagePath of images) {
            try {
                // Handle Cloudinary URLs
                if (imagePath.startsWith('https://res.cloudinary.com/') || imagePath.startsWith('http://res.cloudinary.com/')) {
                    const filename = imagePath.split('/').pop() || 'image.jpg';
                    attachments.push({
                        filename: filename,
                        path: imagePath,
                    });
                    continue;
                }
                // Handle other external URLs (skip)
                if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                    continue;
                }
                // Extract filename from local path
                let filename = imagePath;
                if (imagePath.includes('/api/images/')) {
                    filename = imagePath.split('/api/images/').pop() || imagePath;
                }
                else if (imagePath.includes('/uploads/')) {
                    filename = imagePath.split('/uploads/').pop() || imagePath;
                }
                const fullPath = path_1.default.join(uploadsDir, filename);
                if (fs_1.default.existsSync(fullPath)) {
                    attachments.push({
                        filename: filename,
                        path: fullPath,
                    });
                }
            }
            catch (error) {
                console.error(`Error preparing attachment: ${error.message}`);
            }
        }
        return attachments;
    }
    // Test email configuration
    async verifyConnection() {
        try {
            console.log('🔍 Verifying email connection...');
            await this.transporter.verify();
            console.log('✅ Email connection verified successfully!');
            return true;
        }
        catch (error) {
            console.error('❌ Email connection verification failed:');
            console.error('Error:', error.message);
            console.error('Code:', error.code);
            console.error('Command:', error.command);
            return false;
        }
    }
    // Send test email
    async sendTestEmail(to) {
        console.log(`\n📧 Sending test email to ${to}...`);
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject: 'Test Email from BookInk',
            html: `
        <h1>Test Email</h1>
        <p>This is a test email from the BookInk system.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Test email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('Response:', info.response);
        }
        catch (error) {
            console.error('❌ Failed to send test email:');
            console.error('Error:', error.message);
            console.error('Code:', error.code);
            console.error('Response:', error.response);
            throw error;
        }
    }
    async sendWelcomeEmail(to, name) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject: '🎉 Herzlichen Glückwunsch! 30% Gutschein gewonnen!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0A; color: #fff; padding: 20px;">
          <h1 style="color: #FF3D00;">Herzlichen Glückwunsch, ${name}!</h1>
          <p>Du hast einen <strong style="color: #FF3D00;">30% Gutschein</strong> für ein Tattoo deiner Wahl gewonnen!</p>
          <p>Aktiviere jetzt unverbindlich deinen Gutschein per WhatsApp:</p>
          <a href="${process.env.WHATSAPP_LINK}" style="display: inline-block; background: #FF3D00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Jetzt Gutschein aktivieren
          </a>
          <p style="color: #B0B0B0; font-size: 14px;">Oder kontaktiere uns unter: ${process.env.WHATSAPP_NUMBER}</p>
        </div>
      `
        };
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);
    }
    /**
     * Queue admin notification email (public API)
     */
    async sendAdminNotification(lead) {
        await simple_email_queue_service_1.simpleEmailQueueService.queueEmail('admin_notification', lead);
    }
    /**
     * Actually send admin notification email (called by queue processor)
     * Public method for queue service
     */
    async sendAdminNotificationEmail(lead) {
        const images = Array.isArray(lead.reference_images)
            ? lead.reference_images
            : JSON.parse(lead.reference_images || '[]');
        // Prepare attachments
        const attachments = this.prepareImageAttachments(images);
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: 'bookinktermine@gmail.com',
            subject: `Neue Anfrage: ${lead.name} - BookInk`,
            attachments,
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
            <p><strong>📎 Referenzbilder:</strong></p>
            <p style="background: #f0f9ff; padding: 10px; border-left: 3px solid #000;">
              ${images.length} ${images.length === 1 ? 'Bild wurde' : 'Bilder wurden'} als Anhang beigefügt. Bitte öffne ${images.length === 1 ? 'den Anhang' : 'die Anhänge'}, um ${images.length === 1 ? 'das Referenzbild' : 'die Referenzbilder'} anzusehen.
            </p>
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

          <div style="font-size: 11px; color: #999;">
            <p><strong>English Translation:</strong></p>
            <p>New tattoo request from ${lead.name}. Contact: ${lead.email} / ${lead.whatsapp_country_code} ${lead.whatsapp_number}. Discount offered: ${lead.discount_percentage}%. Description: ${lead.tattoo_description}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
          <p style="font-size: 12px; color: #666;">BookInk Lead Management System - Automatische Benachrichtigung</p>
        </div>
      `
        };
        try {
            console.log(`📧 [EMAIL] Attempting to send admin notification for Lead #${lead.id}`);
            console.log(`📧 [EMAIL] From: ${mailOptions.from}`);
            console.log(`📧 [EMAIL] To: ${mailOptions.to}`);
            console.log(`📧 [EMAIL] Subject: ${mailOptions.subject}`);
            console.log(`📧 [EMAIL] Attachments: ${attachments.length}`);
            console.log(`📧 [EMAIL] SMTP Host: smtp.gmail.com:587`);
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ [EMAIL] Admin email sent successfully for Lead #${lead.id}`);
            console.log(`✅ [EMAIL] Message ID: ${info.messageId}`);
            console.log(`✅ [EMAIL] Response: ${info.response}`);
            console.log(`✅ [EMAIL] Accepted: ${JSON.stringify(info.accepted)}`);
            console.log(`✅ [EMAIL] Rejected: ${JSON.stringify(info.rejected)}`);
        }
        catch (error) {
            console.error(`❌ [EMAIL] Failed to send admin email for Lead #${lead.id}`);
            console.error(`❌ [EMAIL] Error Message: ${error.message}`);
            console.error(`❌ [EMAIL] Error Code: ${error.code}`);
            console.error(`❌ [EMAIL] Error Command: ${error.command}`);
            console.error(`❌ [EMAIL] Error Response: ${error.response}`);
            console.error(`❌ [EMAIL] Full Error: ${JSON.stringify(error, null, 2)}`);
            throw error;
        }
    }
    /**
     * Queue user confirmation email (public API)
     */
    async sendUserConfirmation(lead) {
        await simple_email_queue_service_1.simpleEmailQueueService.queueEmail('user_confirmation', lead);
    }
    /**
     * Actually send user confirmation email (called by queue processor)
     * Public method for queue service
     */
    async sendUserConfirmationEmail(lead) {
        const images = Array.isArray(lead.reference_images)
            ? lead.reference_images
            : JSON.parse(lead.reference_images || '[]');
        // Prepare attachments
        const attachments = this.prepareImageAttachments(images);
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: lead.email,
            subject: `Anfrage Bestätigung - BookInk`,
            attachments,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <p>Hallo ${lead.name},</p>

          <p>Vielen Dank für deine Tattoo-Anfrage. Wir haben deine Anfrage erhalten und unser Team wird sie in Kürze prüfen.</p>

          <p><strong>Deine Anfrage:</strong></p>
          <p>${lead.tattoo_description}</p>

          ${images.length > 0 ? `
            <p><strong>📎 Deine Referenzbilder:</strong></p>
            <p style="background: #f0f9ff; padding: 10px; border-left: 3px solid #000;">
              ${images.length} ${images.length === 1 ? 'Bild wurde' : 'Bilder wurden'} erfolgreich hochgeladen und ${images.length === 1 ? 'ist' : 'sind'} dieser E-Mail als Anhang beigefügt.
            </p>
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

          <div style="font-size: 11px; color: #999; margin-top: 30px;">
            <p><strong>English Translation:</strong></p>
            <p>Hello ${lead.name},</p>
            <p>Thank you for your tattoo request. We have received your inquiry and our team will review it shortly. We will contact you within 24-48 hours via email or WhatsApp to discuss your design, pricing, and available appointments.</p>
            <p>Best regards, BookInk Team</p>
          </div>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 10px 0;">
          <p style="font-size: 12px; color: #666;">Dies ist eine automatische Bestätigung. Bitte bewahre diese E-Mail für deine Unterlagen auf.</p>
        </div>
      `
        };
        try {
            console.log(`📧 [EMAIL] Attempting to send user confirmation to ${lead.email}`);
            console.log(`📧 [EMAIL] From: ${mailOptions.from}`);
            console.log(`📧 [EMAIL] To: ${mailOptions.to}`);
            console.log(`📧 [EMAIL] Subject: ${mailOptions.subject}`);
            console.log(`📧 [EMAIL] Attachments: ${attachments.length}`);
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ [EMAIL] Confirmation sent successfully to ${lead.email}`);
            console.log(`✅ [EMAIL] Message ID: ${info.messageId}`);
            console.log(`✅ [EMAIL] Response: ${info.response}`);
        }
        catch (error) {
            console.error(`❌ [EMAIL] Failed to send confirmation to ${lead.email}`);
            console.error(`❌ [EMAIL] Error Message: ${error.message}`);
            console.error(`❌ [EMAIL] Error Code: ${error.code}`);
            console.error(`❌ [EMAIL] Error Command: ${error.command}`);
            console.error(`❌ [EMAIL] Full Error: ${JSON.stringify(error, null, 2)}`);
            throw error;
        }
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map