import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CheckSquare, CheckCircle2, XCircle, ShieldCheck, AlertCircle, RefreshCw, Zap } from 'lucide-react';

export function ApprovalQueue() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState(null);
  const [resolvingWithAutopilot, setResolvingWithAutopilot] = useState(false);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await api.getActions();
      setActions(data);
    } catch (err) {
      console.error('Failed to load approval actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleExecute = async (actionId) => {
    try {
      setExecutingId(actionId);
      await api.executeAction(actionId);
      await loadActions();
      alert('Action approved and dispatched via WhatsApp successfully!');
    } catch (err) {
      alert(err.message || 'Execution error');
    } finally {
      setExecutingId(null);
    }
  };

  const handleAutoResolveSafe = async () => {
    try {
      setResolvingWithAutopilot(true);
      const res = await api.triggerAutopilotCycle();
      await loadActions();
      alert(`Autopilot resolved ${res.autoApproved || 0} safe opportunities! Projected value: ₹${Number(res.recoveredProjectedValue || 0).toLocaleString('en-IN')}`);
    } catch (err) {
      alert(err.message || 'Autopilot resolution failed');
    } finally {
      setResolvingWithAutopilot(false);
    }
  };

  const pendingActions = actions.filter(a => a.status === 'pending_approval');
  const pastActions = actions.filter(a => a.status !== 'pending_approval');

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Merchant Approval Queue
            </h1>
            <p className="text-xs text-slate-400">
              Human-in-the-loop governance: review and authorize AI-generated recovery interventions before dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAutoResolveSafe}
            disabled={resolvingWithAutopilot}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors disabled:opacity-50 cursor-pointer"
            title="Automatically approves high-confidence opportunities within policy discount caps"
          >
            <Zap className={`w-3.5 h-3.5 text-cyan-400 ${resolvingWithAutopilot ? 'animate-bounce' : ''}`} />
            <span>{resolvingWithAutopilot ? 'Resolving...' : 'Auto-Resolve Safe Items'}</span>
          </button>

          <button
            onClick={loadActions}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Pending Items */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          Pending Authorizations ({pendingActions.length})
        </h3>

        {pendingActions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-8 text-center text-xs text-slate-400">
            No actions awaiting merchant approval. The AI Agent will populate new actions as checkouts are analyzed.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingActions.map((act) => {
              const payload = act.payload || {};
              const rec = payload.recommendedAction || {};
              const impact = payload.projectedImpact || {};

              return (
                <div
                  key={act.id}
                  className="rounded-2xl border border-amber-500/20 bg-slate-900/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">{act.id}</span>
                      <StatusBadge status={act.status} />
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rec.discountPercent || 10}% Discount
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {act.opportunity_title || 'WhatsApp Cart Recovery Intervention'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cart ID: <span className="font-mono text-slate-300">{act.cart_id}</span> • Customer ID: <span className="font-mono text-slate-300">{act.customer_id}</span>
                    </p>
                    <div className="text-xs text-slate-300 pt-1">
                      Expected Revenue Recovery: <span className="font-bold text-emerald-400">₹{Number(impact.minRevenue || 1500).toLocaleString('en-IN')} – ₹{Number(impact.maxRevenue || 4000).toLocaleString('en-IN')}</span> (Confidence: {Math.round((impact.confidence || 0.75) * 100)}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExecute(act.id)}
                      disabled={executingId === act.id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {executingId === act.id ? 'Dispatching...' : 'Approve & Send WhatsApp'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Queue */}
      {pastActions.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resolved Action History ({pastActions.length})
          </h3>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                <tr>
                  <th className="p-3.5">Action ID</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastActions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-900/50">
                    <td className="p-3.5 font-mono text-slate-300">{act.id}</td>
                    <td className="p-3.5 font-semibold text-slate-200">{act.type}</td>
                    <td className="p-3.5"><StatusBadge status={act.status} /></td>
                    <td className="p-3.5 text-slate-400">{new Date(act.executed_at || act.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
