"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public route for lead submission
router.post('/', lead_controller_1.leadController.create.bind(lead_controller_1.leadController));
// Protected routes for admin
router.get('/', auth_1.authenticateToken, lead_controller_1.leadController.getAll.bind(lead_controller_1.leadController));
router.get('/:id', auth_1.authenticateToken, lead_controller_1.leadController.getById.bind(lead_controller_1.leadController));
router.patch('/:id/status', auth_1.authenticateToken, lead_controller_1.leadController.updateStatus.bind(lead_controller_1.leadController));
router.post('/bulk-delete', auth_1.authenticateToken, lead_controller_1.leadController.bulkDelete.bind(lead_controller_1.leadController));
router.delete('/:id', auth_1.authenticateToken, lead_controller_1.leadController.delete.bind(lead_controller_1.leadController));
exports.default = router;
//# sourceMappingURL=lead.routes.js.map