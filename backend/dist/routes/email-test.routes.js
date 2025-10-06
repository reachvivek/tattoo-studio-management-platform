"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_test_controller_1 = require("../controllers/email-test.controller");
const router = (0, express_1.Router)();
// GET /api/email-test/verify - Verify email connection
router.get('/verify', (req, res) => email_test_controller_1.emailTestController.verifyConnection(req, res));
// GET /api/email-test/config - Get email configuration
router.get('/config', (req, res) => email_test_controller_1.emailTestController.getConfig(req, res));
// POST /api/email-test/send - Send test email
router.post('/send', (req, res) => email_test_controller_1.emailTestController.sendTest(req, res));
exports.default = router;
//# sourceMappingURL=email-test.routes.js.map