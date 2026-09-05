import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import merchantRoutes from './routes/merchantRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import autopilotRoutes from './routes/autopilotRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import customerRoutes from './routes/customerRoutes.js';

export const app = express();

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RazorAgent — AI Revenue Autopilot',
    timestamp: new Date().toISOString(),
    aiAgent: {
      status: 'active',
      engine: 'TaskAgent & RecoveryAgent',
      endpoints: [
        'POST /api/autopilot/task (or /api/agent/task)',
        'GET /api/autopilot/tasks (or /api/agent/tasks)',
        'POST /api/autopilot/scan',
        'GET /api/autopilot/opportunities',
        'POST /api/autopilot/opportunities/:id/approve',
        'POST /api/autopilot/opportunities/:id/reject',
        'GET /api/autopilot/actions',
        'POST /api/autopilot/actions/:id/execute',
        'GET /api/autopilot/settings',
        'POST /api/autopilot/settings',
        'POST /api/autopilot/trigger-cycle',
        'GET /api/autopilot/activity-stream'
      ]
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/autopilot', autopilotRoutes);
app.use('/api/agent', autopilotRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/customers', customerRoutes);

// Global Error Handler
app.use(errorHandler);
