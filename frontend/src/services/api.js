const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('razoragent_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('razoragent_token', token);
  } else {
    localStorage.removeItem('razoragent_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),

  // Merchant
  getProfile: () => request('/merchant/profile'),
  updateProfile: (data) => request('/merchant/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getPolicies: () => request('/merchant/policies'),
  updatePolicies: (data) => request('/merchant/policies', { method: 'PUT', body: JSON.stringify(data) }),

  // Catalog
  getProducts: () => request('/catalog/products'),

  // Customers & Smart Segmentation
  getCustomers: (segment = '') => request(`/customers${segment && segment !== 'All' ? `?segment=${encodeURIComponent(segment)}` : ''}`),
  getCustomerById: (id) => request(`/customers/${id}`),
  createCustomerCampaign: (payload) => request('/customers/campaign', { method: 'POST', body: JSON.stringify(payload) }),

  // Orders & Analytics
  getOrders: () => request('/orders'),
  getOrderById: (id) => request(`/orders/${id}`),
  getAnalytics: () => request('/analytics'),
  getRevenueAnalytics: () => request('/analytics/revenue'),
  getPaymentsAnalytics: () => request('/analytics/payments'),
  getCheckoutAnalytics: () => request('/analytics/checkout'),

  // Autopilot
  scanOpportunities: () => request('/autopilot/scan', { method: 'POST' }),
  getOpportunities: () => request('/autopilot/opportunities'),
  getOpportunityById: (id) => request(`/autopilot/opportunities/${id}`),
  approveOpportunity: (id) => request(`/autopilot/opportunities/${id}/approve`, { method: 'POST' }),
  rejectOpportunity: (id, reason) => request(`/autopilot/opportunities/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getActions: () => request('/autopilot/actions'),
  executeAction: (id, payload = {}) => request(`/autopilot/actions/${id}/execute`, { method: 'POST', body: JSON.stringify(payload) }),
  createAction: (payload) => request('/autopilot/actions', { method: 'POST', body: JSON.stringify(payload) }),
  approveAction: (id) => request(`/autopilot/actions/${id}/approve`, { method: 'POST' }),
  rejectAction: (id) => request(`/autopilot/actions/${id}/reject`, { method: 'POST' }),
  getRevenueAnalysis: (q = '') => request(`/autopilot/revenue-analysis?q=${encodeURIComponent(q)}`),
  queryRevenueAgent: (payload) => request('/autopilot/revenue-analysis', { method: 'POST', body: JSON.stringify(payload) }),
  promoteOpportunityToAction: (payload) => request('/autopilot/promote-opportunity', { method: 'POST', body: JSON.stringify(payload) }),
  executeAgentTask: (payload) => request('/autopilot/task', { method: 'POST', body: JSON.stringify(payload) }),
  getAgentTaskHistory: () => request('/autopilot/tasks'),
  getAutopilotSettings: () => request('/autopilot/settings'),
  updateAutopilotSettings: (payload) => request('/autopilot/settings', { method: 'POST', body: JSON.stringify(payload) }),
  triggerAutopilotCycle: (payload = {}) => request('/autopilot/trigger-cycle', { method: 'POST', body: JSON.stringify(payload) }),
  getAutopilotActivityStream: (limit = 25) => request(`/autopilot/activity-stream?limit=${limit}`),

  // WhatsApp
  sendMessage: (payload) => request('/whatsapp/send', { method: 'POST', body: JSON.stringify(payload) }),
  sendWhatsAppSalesMessage: (payload) => request('/whatsapp/sales-message', { method: 'POST', body: JSON.stringify(payload) }),
  getWhatsAppMessages: () => request('/whatsapp/messages'),
  optInCustomer: (payload) => request('/whatsapp/opt-in', { method: 'POST', body: JSON.stringify(payload) }),
  optOutCustomer: (payload) => request('/whatsapp/opt-out', { method: 'POST', body: JSON.stringify(payload) }),

  // Checkout (Public & Payment)
  getCartByToken: (token) => request(`/checkout/cart/${token}`),
  createOrder: (payload) => request('/checkout/create-order', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (payload) => request('/checkout/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),

  // Audit
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/audit${qs ? `?${qs}` : ''}`);
  },

  // Demo Runner
  runDemoScenario: () => request('/demo/run-scenario', { method: 'POST' }),
  resetDemo: () => request('/demo/reset', { method: 'POST' }),
  runFailureScenario: () => request('/demo/run-failure', { method: 'POST' }),

  // AI Support Chatbot
  sendChatMessage: (payload) => request('/chat/message', { method: 'POST', body: JSON.stringify(payload) }),
  getChatFaqs: (context = 'customer') => request(`/chat/faq?context=${encodeURIComponent(context)}`),

  // Email Communications & Transactional Messages
  getEmailCommunications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/email/communications${qs ? `?${qs}` : ''}`);
  },
  getEmailStats: () => request('/email/stats'),
  sendEmail: (payload) => request('/email/send', { method: 'POST', body: JSON.stringify(payload) }),
  sendEmailReply: (payload) => request('/email/reply', { method: 'POST', body: JSON.stringify(payload) }),
  sendCartRecoveryEmail: (cartId, payload = {}) => request(`/email/recovery/${cartId}`, { method: 'POST', body: JSON.stringify(payload) }),
  submitClientInquiry: (payload) => request('/email/inquiry', { method: 'POST', body: JSON.stringify(payload) }),
  getEmailPreviewUrl: (id) => `/api/email/preview/${id}`
};
