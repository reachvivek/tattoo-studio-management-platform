import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
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
}

export const emailService = new EmailService();
