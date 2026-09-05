import { Router } from 'express';
import { OrdersController } from '../controllers/ordersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/', OrdersController.getOrders);
router.get('/:id', OrdersController.getOrderById);

export default router;
