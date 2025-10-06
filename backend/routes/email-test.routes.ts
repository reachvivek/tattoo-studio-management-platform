import { Router } from 'express';
import { emailTestController } from '../controllers/email-test.controller';

const router = Router();

// GET /api/email-test/verify - Verify email connection
router.get('/verify', (req, res) => emailTestController.verifyConnection(req, res));

// GET /api/email-test/config - Get email configuration
router.get('/config', (req, res) => emailTestController.getConfig(req, res));

// POST /api/email-test/send - Send test email
router.post('/send', (req, res) => emailTestController.sendTest(req, res));

export default router;
