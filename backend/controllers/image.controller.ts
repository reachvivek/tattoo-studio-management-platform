import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export class ImageController {
  async getImage(req: Request, res: Response) {
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
      const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
      const imagePath = path.join(uploadsDir, filename);

      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }

      // Get file extension and set content type
      const ext = path.extname(filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
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
      const fileStream = fs.createReadStream(imagePath);
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

    } catch (error: any) {
      console.error('Error serving image:', error);
      res.status(500).json({
        success: false,
        error: 'Error serving image'
      });
    }
  }

  async getImageMetadata(req: Request, res: Response) {
    try {
      const filename = req.params.filename;

      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid filename'
        });
      }

      const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
      const imagePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
          success: false,
          error: 'Image not found'
        });
      }

      const stats = fs.statSync(imagePath);
      const ext = path.extname(filename).toLowerCase();

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

    } catch (error: any) {
      console.error('Error getting image metadata:', error);
      res.status(500).json({
        success: false,
        error: 'Error getting image metadata'
      });
    }
  }
}

export const imageController = new ImageController();
