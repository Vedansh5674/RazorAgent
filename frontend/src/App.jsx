import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatBotWidget } from './components/ChatBotWidget';

// Pages
import { Dashboard } from './pages/Dashboard';
import { AIAgent } from './pages/AIAgent';
import { ActionCenter } from './pages/ActionCenter';
import { Customers } from './pages/Customers';
import { Products } from './pages/Products';
import { WhatsAppAgent } from './pages/WhatsAppAgent';
import { OrdersPayments } from './pages/OrdersPayments';
import { Analytics } from './pages/Analytics';

// Secondary & Auxiliary Pages
import { Opportunities } from './pages/Opportunities';
import { ApprovalQueue } from './pages/ApprovalQueue';
import { WhatsAppRecovery } from './pages/WhatsAppRecovery';
import { EmailCommunications } from './pages/EmailCommunications';
import { AuditTrail } from './pages/AuditTrail';
import { Settings } from './pages/Settings';
import { CheckoutSimulator } from './pages/CheckoutSimulator';
import { Login } from './pages/Login';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading AI Revenue Autopilot...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            {/* Core 8 Pages */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-agent" element={<AIAgent />} />
            <Route path="/action-center" element={<ActionCenter />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/whatsapp-agent" element={<WhatsAppAgent />} />
            <Route path="/orders" element={<OrdersPayments />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Aliased & Secondary Routes */}
            <Route path="/approval-queue" element={<ActionCenter />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/whatsapp-recovery" element={<WhatsAppAgent />} />
            <Route path="/email-communications" element={<EmailCommunications />} />
            <Route path="/audit-trail" element={<AuditTrail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <>
      <Routes>
        {/* Public Customer Recovery / WhatsApp Checkout Route */}
        <Route path="/checkout/:token" element={<CheckoutSimulator />} />
        <Route path="/login" element={<Login />} />
        {/* Protected Merchant Portal Routes */}
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
      {/* Universal Context-Aware AI Support Chatbot */}
      <ChatBotWidget />
    </>
  );
}

export default App;
