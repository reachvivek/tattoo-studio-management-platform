import { Request, Response } from 'express';

export class UploadController {
  async uploadFiles(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({
          success: false,
          error: 'Keine Dateien hochgeladen'
        });
      }

      const filePaths = req.files.map(file => `/uploads/${file.filename}`);

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
