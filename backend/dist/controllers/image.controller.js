"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageController = exports.ImageController = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class ImageController {
    async getImage(req, res) {
        try {
            const filename = req.params.filename;
            // Security: Prevent directory traversal
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filename'
                });
            }
            // Use process.cwd() to get the root directory, then go to uploads
            const uploadsDir = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
            const imagePath = path_1.default.join(uploadsDir, filename);
            // Check if file exists
            if (!fs_1.default.existsSync(imagePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }
            // Get file extension and set content type
            const ext = path_1.default.extname(filename).toLowerCase();
            const contentTypeMap = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif'
            };
            const contentType = contentTypeMap[ext] || 'application/octet-stream';
            // Set proper headers for CORS and caching
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:4200');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
            // Read and send file
            const fileStream = fs_1.default.createReadStream(imagePath);
            fileStream.pipe(res);
            fileStream.on('error', (error) => {
                console.error('Error streaming file:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'Error reading image'
                    });
                }
            });
        }
        catch (error) {
            console.error('Error serving image:', error);
            res.status(500).json({
                success: false,
                error: 'Error serving image'
            });
        }
    }
    async getImageMetadata(req, res) {
        try {
            const filename = req.params.filename;
            if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid filename'
                });
            }
            const uploadsDir = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
            const imagePath = path_1.default.join(uploadsDir, filename);
            if (!fs_1.default.existsSync(imagePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found'
                });
            }
            const stats = fs_1.default.statSync(imagePath);
            const ext = path_1.default.extname(filename).toLowerCase();
            res.json({
                success: true,
                data: {
                    filename,
                    size: stats.size,
                    type: ext.substring(1),
                    created: stats.birthtime,
                    modified: stats.mtime
                }
            });
        }
        catch (error) {
            console.error('Error getting image metadata:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting image metadata'
            });
        }
    }
}
exports.ImageController = ImageController;
exports.imageController = new ImageController();
//# sourceMappingURL=image.controller.js.map