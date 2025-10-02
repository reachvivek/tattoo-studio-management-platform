import { Router } from 'express';
import { upload } from '../config/multer';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

router.post('/', upload.array('images', 5), uploadController.uploadFiles.bind(uploadController));

export default router;
