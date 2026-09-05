import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';

const router = Router();

router.post('/message', ChatController.sendMessage);
router.get('/faq', ChatController.getFaqs);

export default router;
