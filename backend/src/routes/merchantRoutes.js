import { Router } from 'express';
import { MerchantController } from '../controllers/merchantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/profile', MerchantController.getProfile);
router.put('/profile', MerchantController.updateProfile);
router.get('/policies', MerchantController.getPolicies);
router.put('/policies', MerchantController.updatePolicies);

export default router;
