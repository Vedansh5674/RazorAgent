import express from 'express';
import { EmailController } from '../controllers/emailController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public route for shoppers submitting inquiries on checkout
router.post('/inquiry', EmailController.submitInquiry);

// Public route for iframe HTML preview
router.get('/preview/:id', EmailController.getPreview);

// Protected merchant routes
router.get('/communications', authenticateToken, EmailController.getCommunications);
router.get('/stats', authenticateToken, EmailController.getStats);
router.post('/send', authenticateToken, EmailController.sendEmail);
router.post('/reply', authenticateToken, EmailController.replyToClient);
router.post('/recovery/:cartId', authenticateToken, EmailController.sendCartRecovery);

export default router;
