import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await api.getOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleApprove = async (oppId) => {
    try {
      setActionLoading(true);
      await api.approveOpportunity(oppId);
      await loadOpportunities();
      if (selectedOpp?.id === oppId) setSelectedOpp(null);
    } catch (err) {
      alert(err.message || 'Approval blocked by policy or execution error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (oppId) => {
    const reason = prompt('Please enter a reason for rejecting this recommendation:');
    if (!reason) return;
    try {
      setActionLoading(true);
      await api.rejectOpportunity(oppId, reason);
      await loadOpportunities();
      if (selectedOpp?.id === oppId) setSelectedOpp(null);
    } catch (err) {
      alert(err.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Revenue Opportunities Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            AI-discovered abandoned checkout recovery actions awaiting merchant approval or tracking.
          </p>
        </div>

        <button
          onClick={loadOpportunities}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 text-sm">
          No opportunities currently found. Click Autopilot Scan to analyze carts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => {
            const evidence = opp.evidence || {};
            const action = opp.recommended_action || {};
            const impact = opp.projected_impact || {};
            const isPending = opp.status === 'pending';

            return (
              <div
                key={opp.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg shadow-black/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={opp.status} />
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                      Risk: {opp.risk_level?.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{opp.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">{opp.description}</p>

                  {/* Evidence Box */}
                  <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3.5 text-xs space-y-2 mb-4">
                    <div className="flex justify-between text-slate-300">
                      <span>Cart Abandoned:</span>
                      <span className="font-bold text-white">₹{Number(opp.cart_total || evidence.cartValue || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Customer:</span>
                      <span className="text-slate-200">{opp.customer_name || 'Customer'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Age:</span>
                      <span className="text-amber-400 font-semibold">{evidence.checkoutAgeMinutes || 45} mins</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Projected Return:</span>
                      <span className="text-emerald-400 font-bold">
                        ₹{Number(impact.minRevenue || 1500).toLocaleString('en-IN')} – ₹{Number(impact.maxRevenue || 4500).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="text-xs text-slate-300 mb-6">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Recommended Action:</span>
                    <span className="font-semibold text-blue-400">
                      Send WhatsApp Recovery with {action.discountPercent || 10}% Discount
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOpp(opp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    {isPending && (
                      <button
                        onClick={() => handleReject(opp.id)}
                        disabled={actionLoading}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isPending && (
                    <button
                      onClick={() => handleApprove(opp.id)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Dispatch Recovery
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Opportunity Details Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-blue-400">{selectedOpp.id}</span>
                <h3 className="text-base font-bold text-white">{selectedOpp.title}</h3>
              </div>
              <button
                onClick={() => setSelectedOpp(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-200">Customer & Cart Telemetry</div>
                <div className="flex justify-between text-slate-400">
                  <span>Customer:</span>
                  <span className="text-slate-200">{selectedOpp.customer_name} ({selectedOpp.customer_phone || '+91...'})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Original Cart Amount:</span>
                  <span className="text-white font-bold">₹{Number(selectedOpp.cart_total || selectedOpp.evidence?.cartValue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Checkout Age:</span>
                  <span className="text-amber-400">{selectedOpp.evidence?.checkoutAgeMinutes || 45} minutes</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-200">Action & Policy Compliance</div>
                <div className="flex justify-between text-slate-400">
                  <span>Action Type:</span>
                  <span className="text-blue-400 font-semibold">{selectedOpp.recommended_action?.type}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount Cap:</span>
                  <span className="text-emerald-400 font-semibold">{selectedOpp.recommended_action?.discountPercent || 10}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Channel:</span>
                  <span className="text-whatsapp-green font-semibold">WhatsApp Cloud API</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => setSelectedOpp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              {selectedOpp.status === 'pending' && (
                <button
                  onClick={() => handleApprove(selectedOpp.id)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-md shadow-blue-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Action
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
