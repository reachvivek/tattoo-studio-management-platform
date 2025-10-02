import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';

const router = Router();

router.post('/', leadController.create.bind(leadController));
router.get('/', leadController.getAll.bind(leadController));
router.get('/:id', leadController.getById.bind(leadController));
router.patch('/:id/status', leadController.updateStatus.bind(leadController));

export default router;
