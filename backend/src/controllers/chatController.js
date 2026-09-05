import { ChatService } from '../services/chatService.js';

export class ChatController {
  static async sendMessage(req, res, next) {
    try {
      const { message, context = 'customer', cartToken, history = [] } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'BadRequest', message: 'Message text is required' });
      }

      const response = await ChatService.processMessage({
        message,
        context,
        cartToken,
        history
      });

      res.json(response);
    } catch (err) {
      next(err);
    }
  }

  static async getFaqs(req, res, next) {
    try {
      const { context = 'customer' } = req.query;
      const faqs = ChatService.getFaqs(context);
      res.json(faqs);
    } catch (err) {
      next(err);
    }
  }
}
