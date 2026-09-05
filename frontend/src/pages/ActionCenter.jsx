import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Zap,
  Clock,
  Eye,
  ArrowRight,
  Flame,
  MessageSquare,
  Mail,
  Send,
  Sliders,
  Filter,
  Users,
  DollarSign,
  PlusCircle,
  X
} from 'lucide-react';

export function ActionCenter() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [processingId, setProcessingId] = useState(null);

  // New action form state
  const [newTitle, setNewTitle] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [newImpact, setNewImpact] = useState(12000);
  const [newChannel, setNewChannel] = useState('WhatsApp');

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await api.getActions();
      setActions(data);
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const handleApprove = async (actionId) => {
    try {
      setProcessingId(actionId);
      await api.approveAction(actionId);
      await loadActions();
      if (selectedAction && selectedAction.id === actionId) {
        setSelectedAction(prev => ({ ...prev, status: 'approved' }));
      }
    } catch (err) {
      alert(err.message || 'Failed to approve action');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (actionId) => {
    try {
      setProcessingId(actionId);
      await api.rejectAction(actionId);
      await loadActions();
      if (selectedAction && selectedAction.id === actionId) {
        setSelectedAction(prev => ({ ...prev, status: 'rejected' }));
      }
    } catch (err) {
      alert(err.message || 'Failed to reject action');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecute = async (actionId) => {
    try {
      setProcessingId(actionId);
      await api.executeAction(actionId);
      await loadActions();
      alert('Action executed successfully! Multi-channel recovery dispatched.');
      setReviewModalOpen(false);
    } catch (err) {
      alert(err.message || 'Execution error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createAction({
        title: newTitle,
        reason: newReason || 'Merchant initiated revenue growth intervention',
        priority: newPriority,
        estimatedImpact: Number(newImpact || 0),
        channel: newChannel,
        type: 'custom_merchant_action'
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewReason('');
      await loadActions();
      alert('New action created in Suggested column!');
    } catch (err) {
      alert(err.message || 'Failed to create action');
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const tabs = ['All', 'Suggested', 'Approved', 'Executing', 'Completed', 'Rejected'];

  const filteredActions = actions.filter((act) => {
    if (activeTab === 'All') return true;
    const s = (act.status || '').toLowerCase();
    if (activeTab === 'Suggested') return s === 'suggested' || s === 'pending_approval';
    return s === activeTab.toLowerCase();
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
              Core Feature 2
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              Merchant Governance
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-cyan-400" />
            AI Action Center
          </h1>
          <p className="text-xs text-slate-400">
            Lifecycle: <span className="text-cyan-300 font-semibold">Suggested → Approved → Executing → Completed</span>. Review & authorize AI actions before execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Action</span>
          </button>
          <button
            onClick={loadActions}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Lifecycle Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {tabs.map((tab) => {
          const count = actions.filter(act => {
            if (tab === 'All') return true;
            const s = (act.status || '').toLowerCase();
            if (tab === 'Suggested') return s === 'suggested' || s === 'pending_approval';
            return s === tab.toLowerCase();
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab ? 'bg-cyan-800 text-cyan-200' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Actions List */}
      {filteredActions.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-12 text-center text-xs text-slate-400 space-y-3">
          <CheckSquare className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No actions found in "{activeTab}" status.</p>
          <p className="text-[11px] text-slate-500">
            Ask the AI Revenue Agent or run a Revenue Audit to discover new suggested actions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredActions.map((act) => {
            const payload = typeof act.payload === 'string' ? JSON.parse(act.payload || '{}') : (act.payload || {});
            const title = payload.title || act.opportunity_title || 'Revenue Recovery Campaign';
            const reason = payload.reason || 'High-intent cart recovery awaiting approval';
            const priority = payload.priority || 'High';
            const impact = payload.estimatedImpact || 18500;
            const channel = payload.channel || 'WhatsApp';
            const targetCount = payload.targetCustomers || payload.targetCustomersCount || 24;

            const isSuggested = act.status === 'suggested' || act.status === 'pending_approval';
            const isApproved = act.status === 'approved';
            const isCompleted = act.status === 'completed';
            const isRejected = act.status === 'rejected';

            const isProcessing = processingId === act.id;

            return (
              <div
                key={act.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Priority + Status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      priority === 'High'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {priority} Priority
                    </span>
                    <StatusBadge status={act.status} />
                  </div>

                  {/* Title & Reason */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {reason}
                    </p>
                  </div>

                  {/* Telemetry Block */}
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Estimated Impact:</span>
                      <span className="font-bold text-emerald-400">{formatINR(impact)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Target Audience:</span>
                      <span className="text-white font-medium">{targetCount} Customers</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Channel:</span>
                      <span className="text-cyan-300 font-semibold">{channel}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedAction(act);
                      setReviewModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Review</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isSuggested && (
                      <>
                        <button
                          onClick={() => handleReject(act.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                          title="Reject Action"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleApprove(act.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? '...' : 'Approve'}
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => handleExecute(act.id)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{isProcessing ? 'Executing...' : 'Execute Now'}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}

                    {isRejected && (
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && selectedAction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Action Inspection</span>
                <h3 className="text-base font-bold text-white">Review Revenue Intervention</h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const payload = typeof selectedAction.payload === 'string' ? JSON.parse(selectedAction.payload || '{}') : (selectedAction.payload || {});
              return (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Title:</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{payload.title || selectedAction.opportunity_title}</h4>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">Reason:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{payload.reason || 'Identified by AI Revenue Agent'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Estimated Impact</span>
                      <span className="text-sm font-bold text-emerald-400">{formatINR(payload.estimatedImpact || 18500)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Channel</span>
                      <span className="text-sm font-bold text-cyan-400">{payload.channel || 'WhatsApp'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Target Audience</span>
                      <span className="text-sm font-bold text-white">{payload.targetCustomers || 24} Customers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current Status</span>
                      <span className="text-sm font-bold uppercase text-amber-400">{selectedAction.status}</span>
                    </div>
                  </div>

                  {payload.customMessage && (
                    <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                      <span className="text-purple-300 font-bold text-[11px]">Proposed Message Preview:</span>
                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed">"{payload.customMessage}"</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setReviewModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                    >
                      Close
                    </button>
                    {(selectedAction.status === 'suggested' || selectedAction.status === 'pending_approval') && (
                      <button
                        onClick={() => handleApprove(selectedAction.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 cursor-pointer"
                      >
                        Approve Action
                      </button>
                    )}
                    {selectedAction.status === 'approved' && (
                      <button
                        onClick={() => handleExecute(selectedAction.id)}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 cursor-pointer flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Execute Now</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create Action Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateAction} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Create New Revenue Action</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Action Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. VIP Customer Flash Sale Broadcast"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Reason & Objective</label>
                <textarea
                  rows={2}
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Re-engage high-spending VIP customers with exclusive discount"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Checkout">Checkout Portal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Estimated Revenue Impact (₹)</label>
                <input
                  type="number"
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40"
              >
                Create Suggested Action
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
