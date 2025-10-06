import { Request, Response } from 'express';
import { emailService } from '../services/email.service';

export class EmailTestController {
  // Test email connection
  async verifyConnection(req: Request, res: Response) {
    try {
      const isConnected = await emailService.verifyConnection();

      if (isConnected) {
        res.json({
          success: true,
          message: 'Email connection verified successfully',
          config: {
            user: process.env.EMAIL_USER,
            from: process.env.EMAIL_FROM,
            service: process.env.EMAIL_SERVICE || 'gmail'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Email connection verification failed - check console logs'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Send test email
  async sendTest(req: Request, res: Response) {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'Email address (to) is required'
        });
      }

      await emailService.sendTestEmail(to);

      res.json({
        success: true,
        message: `Test email sent to ${to} - check your inbox!`
      });
    } catch (error: any) {
      console.error('Test email failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: {
          code: error.code,
          command: error.command,
          response: error.response
        }
      });
    }
  }

  // Get email configuration
  async getConfig(req: Request, res: Response) {
    res.json({
      success: true,
      config: {
        user: process.env.EMAIL_USER,
        from: process.env.EMAIL_FROM,
        service: process.env.EMAIL_SERVICE || 'gmail',
        passwordSet: !!process.env.EMAIL_PASSWORD,
        passwordLength: process.env.EMAIL_PASSWORD?.length
      }
    });
  }
}

export const emailTestController = new EmailTestController();
