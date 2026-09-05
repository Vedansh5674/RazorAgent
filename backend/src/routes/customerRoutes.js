import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', CustomerController.getCustomers);
router.get('/:id', CustomerController.getCustomerById);
router.post('/campaign', CustomerController.createCampaign);

export default router;
