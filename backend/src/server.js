import { app } from './app.js';
import { config } from './config/env.js';
import { db } from './config/database.js';
import { seedDatabase } from './db/seed.js';

async function startServer() {
  try {
    console.log('---------------------------------------------------------');
    console.log('🚀 Starting RazorAgent — AI Revenue Autopilot Backend');
    console.log('---------------------------------------------------------');
    
    await db.initialize();

    // Verify if merchant exists, if not seed database
    const merchantCheck = await db.query(`SELECT id FROM merchants LIMIT 1`);
    if (merchantCheck.rows.length === 0) {
      console.log('[Server] No merchant data found. Initializing seed data...');
      await seedDatabase();
    }

    const server = app.listen(config.port, () => {
      console.log(`[Server] RazorAgent backend listening at http://localhost:${config.port}`);
      console.log(`[Server] AI Provider Mode: ${config.aiProvider.toUpperCase()}`);
      console.log(`[Server] Database Engine: ${db.getMode().toUpperCase()}`);
      console.log(`[Server] Razorpay Mode: TEST MODE (Key: ${config.razorpayKeyId})`);
      console.log(`[Server] WhatsApp Mode: ${config.whatsappDemoMode ? 'CERTIFIED DEMO SIMULATION' : 'META CLOUD API'}`);
      console.log('---------------------------------------------------------');
    });

    return server;
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
