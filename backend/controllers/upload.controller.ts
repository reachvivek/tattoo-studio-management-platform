import { Request, Response } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.config';

export class UploadController {
  async uploadFiles(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({
          success: false,
          error: 'Keine Dateien hochgeladen'
        });
      }

      const apiPrefix = process.env.API_PREFIX || '/api';
      const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || 'bookink-tattoo-uploads';

      const filePaths = await Promise.all(
        req.files.map(async (file) => {
          const filePath = file.path;
          const fileSize = file.size;
          const maxSize = 5 * 1024 * 1024; // 5MB

          let finalPath = filePath;
          let finalFilename = file.filename;

          // If file is larger than 5MB, compress it
          if (fileSize > maxSize) {
            const compressedFilename = `compressed-${file.filename}`;
            const compressedPath = path.join(path.dirname(filePath), compressedFilename);

            await sharp(filePath)
              .resize(2000, 2000, { // Max 2000px width/height, maintain aspect ratio
                fit: 'inside',
                withoutEnlargement: true
              })
              .jpeg({ quality: 85 }) // High quality JPEG compression
              .toFile(compressedPath);

            // Delete original file
            fs.unlinkSync(filePath);

            finalPath = compressedPath;
            finalFilename = compressedFilename;
          }

          // Upload to Cloudinary if configured, otherwise use local storage
          if (isCloudinaryConfigured) {
            try {
              const uploadResult = await cloudinary.uploader.upload(finalPath, {
                folder: cloudinaryFolder,
                resource_type: 'image',
                transformation: [
                  { quality: 'auto:good' },
                  { fetch_format: 'auto' }
                ]
              });

              // Delete local file after successful upload to Cloudinary
              fs.unlinkSync(finalPath);

              console.log(`✅ Uploaded to Cloudinary: ${uploadResult.secure_url}`);
              return uploadResult.secure_url;
            } catch (cloudinaryError: any) {
              console.error('❌ Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
              // Fall back to local storage if Cloudinary fails
              return `${apiPrefix}/images/${finalFilename}`;
            }
          } else {
            // Local storage (fallback)
            return `${apiPrefix}/images/${finalFilename}`;
          }
        })
      );

      res.json({
        success: true,
        message: 'Dateien erfolgreich hochgeladen',
        data: { urls: filePaths }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const uploadController = new UploadController();
