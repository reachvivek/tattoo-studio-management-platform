"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = exports.UploadController = void 0;
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_config_1 = require("../config/cloudinary.config");
class UploadController {
    async uploadFiles(req, res) {
        try {
            if (!req.files || !Array.isArray(req.files)) {
                return res.status(400).json({
                    success: false,
                    error: 'Keine Dateien hochgeladen'
                });
            }
            const apiPrefix = process.env.API_PREFIX || '/api';
            const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || 'bookink-tattoo-uploads';
            const filePaths = await Promise.all(req.files.map(async (file) => {
                const filePath = file.path;
                const fileSize = file.size;
                const maxSize = 5 * 1024 * 1024; // 5MB
                let finalPath = filePath;
                let finalFilename = file.filename;
                // If file is larger than 5MB, compress it
                if (fileSize > maxSize) {
                    const compressedFilename = `compressed-${file.filename}`;
                    const compressedPath = path_1.default.join(path_1.default.dirname(filePath), compressedFilename);
                    await (0, sharp_1.default)(filePath)
                        .resize(2000, 2000, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                        .jpeg({ quality: 85 }) // High quality JPEG compression
                        .toFile(compressedPath);
                    // Delete original file
                    fs_1.default.unlinkSync(filePath);
                    finalPath = compressedPath;
                    finalFilename = compressedFilename;
                }
                // Upload to Cloudinary if configured, otherwise use local storage
                if (cloudinary_config_1.isCloudinaryConfigured) {
                    try {
                        const uploadResult = await cloudinary_config_1.cloudinary.uploader.upload(finalPath, {
                            folder: cloudinaryFolder,
                            resource_type: 'image',
                            transformation: [
                                { quality: 'auto:good' },
                                { fetch_format: 'auto' }
                            ]
                        });
                        // Delete local file after successful upload to Cloudinary
                        fs_1.default.unlinkSync(finalPath);
                        console.log(`✅ Uploaded to Cloudinary: ${uploadResult.secure_url}`);
                        return uploadResult.secure_url;
                    }
                    catch (cloudinaryError) {
                        console.error('❌ Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
                        // Fall back to local storage if Cloudinary fails
                        return `${apiPrefix}/images/${finalFilename}`;
                    }
                }
                else {
                    // Local storage (fallback)
                    return `${apiPrefix}/images/${finalFilename}`;
                }
            }));
            res.json({
                success: true,
                message: 'Dateien erfolgreich hochgeladen',
                data: { urls: filePaths }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.UploadController = UploadController;
exports.uploadController = new UploadController();
//# sourceMappingURL=upload.controller.js.map