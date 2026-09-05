import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', AuditController.getLogs);
router.get('/:id', AuditController.getLogById);

export default router;
