import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings as SettingsIcon, ShieldCheck, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export function Settings() {
  const [policy, setPolicy] = useState({
    maxDiscountPercent: 10,
    maxDiscountAmount: 500,
    maxCampaignBudget: 5000,
    maxMessagesPerCustomer: 1,
    recoveryWindowHours: 24,
    requiresMerchantApproval: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadPolicy() {
      try {
        setLoading(true);
        const data = await api.getPolicies();
        setPolicy({
          maxDiscountPercent: Number(data.max_discount_percent ?? 10),
          maxDiscountAmount: Number(data.max_discount_amount ?? 500),
          maxCampaignBudget: Number(data.max_campaign_budget ?? 5000),
          maxMessagesPerCustomer: Number(data.max_messages_per_customer ?? 1),
          recoveryWindowHours: Number(data.recovery_window_hours ?? 24),
          requiresMerchantApproval: Boolean(data.requires_merchant_approval)
        });
      } catch (err) {
        console.error('Failed to load policies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updatePolicies(policy);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Policy & Autonomous Guardrails
            </h1>
            <p className="text-xs text-slate-400">
              Configure strict mathematical and regulatory boundaries for AI agent recovery decisions.
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Policies successfully updated and persisted! AI Agent will strictly enforce these rules.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Discount & Budget Guardrails
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Maximum Discount Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={policy.maxDiscountPercent}
                onChange={(e) => setPolicy({ ...policy, maxDiscountPercent: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">AI agent will never exceed this recovery discount rate.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Maximum Discount Cap Per Order (₹)
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={policy.maxDiscountAmount}
                onChange={(e) => setPolicy({ ...policy, maxDiscountAmount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Absolute ceiling for discount deduction per checkout.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Campaign Recovery Budget (₹)
              </label>
              <input
                type="number"
                min="500"
                max="100000"
                value={policy.maxCampaignBudget}
                onChange={(e) => setPolicy({ ...policy, maxCampaignBudget: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Total allowable promotional discount pool.</p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Recovery Window Threshold (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={policy.recoveryWindowHours}
                onChange={(e) => setPolicy({ ...policy, recoveryWindowHours: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Carts older than this threshold are blocked from recovery.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Require Merchant Approval</div>
              <div className="text-[11px] text-slate-400">
                When enabled, AI recommendations must be approved before WhatsApp templates are dispatched.
              </div>
            </div>
            <input
              type="checkbox"
              checked={policy.requiresMerchantApproval}
              onChange={(e) => setPolicy({ ...policy, requiresMerchantApproval: e.target.checked })}
              className="w-5 h-5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Guardrails...' : 'Save Guardrails'}
          </button>
        </div>
      </form>
    </div>
  );
}
