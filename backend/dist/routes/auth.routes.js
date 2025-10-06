"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.authController.login.bind(auth_controller_1.authController));
router.post('/create-admin', auth_controller_1.authController.createAdmin.bind(auth_controller_1.authController));
router.get('/verify', auth_1.authenticateToken, auth_controller_1.authController.verify.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map