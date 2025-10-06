import { Router } from 'express';
import { imageController } from '../controllers/image.controller';

const router = Router();

// GET /api/images/:filename - Serve image as blob
router.get('/:filename', (req, res) => imageController.getImage(req, res));

// GET /api/images/:filename/metadata - Get image metadata
router.get('/:filename/metadata', (req, res) => imageController.getImageMetadata(req, res));

export default router;
