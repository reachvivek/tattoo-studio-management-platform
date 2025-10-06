import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/create-admin', authController.createAdmin.bind(authController));
router.get('/verify', authenticateToken, authController.verify.bind(authController));

export default router;
