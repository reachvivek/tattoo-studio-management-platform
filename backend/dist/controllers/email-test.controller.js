"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTestController = exports.EmailTestController = void 0;
const email_service_1 = require("../services/email.service");
class EmailTestController {
    // Test email connection
    async verifyConnection(req, res) {
        try {
            const isConnected = await email_service_1.emailService.verifyConnection();
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
            }
            else {
                res.status(500).json({
                    success: false,
                    error: 'Email connection verification failed - check console logs'
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    // Send test email
    async sendTest(req, res) {
        try {
            const { to } = req.body;
            if (!to) {
                return res.status(400).json({
                    success: false,
                    error: 'Email address (to) is required'
                });
            }
            await email_service_1.emailService.sendTestEmail(to);
            res.json({
                success: true,
                message: `Test email sent to ${to} - check your inbox!`
            });
        }
        catch (error) {
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
    async getConfig(req, res) {
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
exports.EmailTestController = EmailTestController;
exports.emailTestController = new EmailTestController();
//# sourceMappingURL=email-test.controller.js.map