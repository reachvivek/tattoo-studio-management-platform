"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const image_controller_1 = require("../controllers/image.controller");
const router = (0, express_1.Router)();
// GET /api/images/:filename - Serve image as blob
router.get('/:filename', (req, res) => image_controller_1.imageController.getImage(req, res));
// GET /api/images/:filename/metadata - Get image metadata
router.get('/:filename/metadata', (req, res) => image_controller_1.imageController.getImageMetadata(req, res));
exports.default = router;
//# sourceMappingURL=image.routes.js.map