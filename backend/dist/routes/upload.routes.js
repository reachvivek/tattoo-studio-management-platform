"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = require("../config/multer");
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
router.post('/', multer_1.upload.array('images', 5), upload_controller_1.uploadController.uploadFiles.bind(upload_controller_1.uploadController));
exports.default = router;
//# sourceMappingURL=upload.routes.js.map