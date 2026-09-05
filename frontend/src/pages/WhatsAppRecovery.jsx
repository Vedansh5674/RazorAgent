import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { WhatsAppPreview } from '../components/WhatsAppPreview';
import {
  MessageSquare,
  CheckCheck,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export function WhatsAppRecovery() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await api.getWhatsAppMessages();
      setData(res);
      if (res.messages?.length > 0 && !selectedMessage) {
        setSelectedMessage(res.messages[0]);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const messages = data?.messages || [];
  const previewParams = selectedMessage?.parameters || {
    customerName: 'Aarav Sharma',
    merchantName: 'TrendVault India',
    cartValue: 4298,
    discountPercent: 10,
    discountAmount: 430,
    recoveryUrl: selectedMessage?.recovery_url || 'http://localhost:5173/checkout/recov_tok_aarav_4298'
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              WhatsApp Recovery Hub
            </h1>
            <p className="text-xs text-slate-400">
              Meta Business Cloud API integration, approved template deliveries, and conversion attribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Template: cart_recovery Approved
          </span>
          <button
            onClick={loadMessages}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <span className="text-xs text-slate-400">Total Dispatched</span>
          <div className="text-2xl font-extrabold text-white mt-1">{data?.totalMessages || 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <span className="text-xs text-slate-400">Delivered</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{data?.deliveredMessages || 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <span className="text-xs text-slate-400">Read Receipts</span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">{data?.readMessages || 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <span className="text-xs text-slate-400">Failed / Blocked</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{data?.failedMessages || 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <span className="text-xs text-slate-400">Channel Mode</span>
          <div className="text-sm font-bold text-amber-400 mt-2">Demo Simulation Active</div>
        </div>
      </div>

      {/* Preview and Message Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real WhatsApp Chat Bubble Preview */}
        <div className="flex flex-col items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 self-start">
            Live Customer WhatsApp Experience
          </h3>
          <WhatsAppPreview
            customerName={previewParams.customerName}
            merchantName={previewParams.merchantName || 'TrendVault India'}
            cartValue={previewParams.cartValue}
            discountPercent={previewParams.discountPercent}
            discountAmount={previewParams.discountAmount}
            checkoutUrl={previewParams.recoveryUrl}
          />
          <p className="text-[11px] text-slate-400 text-center mt-3 max-w-xs">
            Notice: In Demo Mode, messages and delivery webhooks are safely simulated without requiring paid Meta accounts.
          </p>
        </div>

        {/* Message Log Table */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Delivered Message Logs</h3>
            <p className="text-xs text-slate-400 mb-4">Audited customer messages and delivery tracking status</p>

            {messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No recovery messages sent yet. Approve an opportunity to dispatch one!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="pb-3">Recipient</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Discount</th>
                      <th className="pb-3">Recovery URL</th>
                      <th className="pb-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {messages.map((m) => {
                      const params = m.parameters || {};
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedMessage(m)}
                          className={`cursor-pointer transition-colors ${
                            selectedMessage?.id === m.id ? 'bg-blue-600/10' : 'hover:bg-slate-900/40'
                          }`}
                        >
                          <td className="py-3 font-medium text-slate-200">
                            <div>{m.customer_name || 'Customer'}</div>
                            <div className="text-[10px] text-slate-400">{m.phone_number}</div>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={m.status} />
                          </td>
                          <td className="py-3 font-semibold text-emerald-400">
                            {params.discountPercent || 10}%
                          </td>
                          <td className="py-3">
                            {m.recovery_url ? (
                              <a
                                href={m.recovery_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3 text-slate-400 text-[11px]">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
