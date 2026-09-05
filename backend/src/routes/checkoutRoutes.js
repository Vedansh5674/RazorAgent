import { Router } from 'express';
import { CheckoutController } from '../controllers/checkoutController.js';

const router = Router();

// Public customer recovery checkout endpoints
router.get('/:token', CheckoutController.getCartByToken);
router.get('/cart/:token', CheckoutController.getCartByToken);
router.post('/create-order', CheckoutController.createOrder);
router.post('/verify-payment', CheckoutController.verifyPayment);
router.get('/payment/:id', CheckoutController.getPayment);
router.post('/webhook', CheckoutController.handleWebhook);

export default router;
