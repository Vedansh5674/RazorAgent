import { Router } from 'express';
import { AutopilotController } from '../controllers/autopilotController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.post('/scan', AutopilotController.scan);
router.get('/opportunities', AutopilotController.getOpportunities);
router.get('/opportunities/:id', AutopilotController.getOpportunityById);
router.post('/opportunities/:id/approve', AutopilotController.approveOpportunity);
router.post('/opportunities/:id/reject', AutopilotController.rejectOpportunity);
router.get('/actions', AutopilotController.getActions);
router.post('/actions/:id/execute', AutopilotController.executeAction);
router.post('/task', AutopilotController.executeTask);
router.get('/tasks', AutopilotController.getTaskHistory);

// Action Center & Lifecycle
router.post('/actions', AutopilotController.createAction);
router.post('/actions/:id/approve', AutopilotController.approveAction);
router.post('/actions/:id/reject', AutopilotController.rejectAction);

// AI Revenue Agent Analysis & Promotion
router.get('/revenue-analysis', AutopilotController.getRevenueAnalysis);
router.post('/revenue-analysis', AutopilotController.getRevenueAnalysis);
router.post('/revenue-agent-query', AutopilotController.getRevenueAnalysis);
router.post('/promote-opportunity', AutopilotController.promoteOpportunity);

// Autonomous Engine & Mission Control Endpoints
router.get('/settings', AutopilotController.getSettings);
router.post('/settings', AutopilotController.updateSettings);
router.post('/trigger-cycle', AutopilotController.triggerCycle);
router.get('/activity-stream', AutopilotController.getActivityStream);

export default router;
