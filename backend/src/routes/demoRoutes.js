import { Router } from 'express';
import { DemoController } from '../controllers/demoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Demo endpoints can be called with or without auth for quick judge evaluation
router.post('/run-scenario', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, () => DemoController.runScenario(req, res, next));
  }
  req.merchantId = 'merchant_trendvault_01';
  return DemoController.runScenario(req, res, next);
});

router.post('/reset', DemoController.resetDemo);
router.post('/run-failure', DemoController.runFailureScenario);

export default router;
