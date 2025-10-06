import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route for lead submission
router.post('/', leadController.create.bind(leadController));

// Protected routes for admin
router.get('/', authenticateToken, leadController.getAll.bind(leadController));
router.get('/:id', authenticateToken, leadController.getById.bind(leadController));
router.patch('/:id/status', authenticateToken, leadController.updateStatus.bind(leadController));
router.delete('/:id', authenticateToken, leadController.delete.bind(leadController));

export default router;
