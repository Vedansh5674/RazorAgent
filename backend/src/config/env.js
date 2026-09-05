import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'razoragent_super_secret_buildathon_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/razoragent',
  
  // AI Agent Configuration
  aiProvider: process.env.AI_PROVIDER || 'fallback', // 'ollama' | 'openai' | 'fallback'
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  
  // Razorpay Test Mode Configuration
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_buildathonDemo123',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'secret_buildathonRazorAgent2026',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_razoragent_test_mode',
  
  // WhatsApp Business API Configuration
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'razoragent_wa_verify_token',
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
  whatsappDemoMode: process.env.WHATSAPP_DEMO_MODE !== 'false', // Default true if credentials empty

  // Email Configuration (SMTP / Direct / Certified Demo Mode)
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFromEmail: process.env.SMTP_FROM_EMAIL || 'support@trendvault.in',
  smtpFromName: process.env.SMTP_FROM_NAME || 'TrendVault Store Support',
  emailDemoMode: process.env.EMAIL_DEMO_MODE !== 'false',
  
  // Application URLs
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000'
};
