import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', AnalyticsController.getRevenue);
router.get('/revenue', AnalyticsController.getRevenue);
router.get('/payments', AnalyticsController.getPayments);
router.get('/checkout', AnalyticsController.getCheckout);

export default router;
