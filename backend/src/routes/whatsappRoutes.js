import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsappController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public Webhook endpoints for Meta
router.get('/webhook', WhatsAppController.verifyWebhook);
router.post('/webhook', WhatsAppController.handleWebhook);

// Protected Merchant WhatsApp operations
router.post('/send', authenticateToken, WhatsAppController.sendMessage);
router.get('/messages', authenticateToken, WhatsAppController.getMessages);
router.get('/messages/:id', authenticateToken, WhatsAppController.getMessageById);
router.post('/opt-in', authenticateToken, WhatsAppController.optIn);
router.post('/opt-out', authenticateToken, WhatsAppController.optOut);
// Conversational WhatsApp Sales Agent (Customer & Demo Mode)
router.post('/sales-message', WhatsAppController.handleSalesMessage);

export default router;
