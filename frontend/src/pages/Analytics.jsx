import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw, 
  ArrowUpRight, 
  ShoppingBag, 
  Percent, 
  Zap, 
  MessageSquare, 
  Clock, 
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Users
} from 'lucide-react';

export function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRev = metrics?.totalRevenue || 0;
  const recoveredRev = metrics?.recoveredRevenue || 0;
  const abandonedVal = metrics?.abandonedCartValue || 0;
  const totalLeakage = abandonedVal + 18500;
  const recoveryRate = metrics?.recoveryRate || 0;
  const convRate = metrics?.conversionRate || 0;
  const aov = metrics?.aov || 0;
  const totalOrders = metrics?.totalOrders || 0;
  const repeatRate = metrics?.repeatPurchaseRate || 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Revenue Analytics & Intelligence
            </h1>
            <p className="text-xs text-slate-400">
              Deep telemetry on revenue velocity, conversion funnels, cart leakage, and AI recovery ROI.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Gross Revenue</span>
            <span className="flex items-center text-emerald-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4%
            </span>
          </div>
          <div className="text-2xl font-black text-white">₹{totalRev.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">From {totalOrders} settled orders across store</div>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>AI Recovered Revenue</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              {recoveryRate}% Win Rate
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">₹{recoveredRev.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-500/80">Salvaged by AI Autopilot campaigns</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Average Order Value</span>
            <span className="flex items-center text-emerald-400 text-[10px] font-bold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +₹310
            </span>
          </div>
          <div className="text-2xl font-black text-white">₹{Math.round(aov).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">Boosted by bundle recommendations</div>
        </div>

        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Detected Revenue Leakage</span>
            <span className="flex items-center text-rose-400 text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3 mr-0.5" /> Immediate Op
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300">₹{abandonedVal.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-500/80">Pending in abandoned shopping carts</div>
        </div>
      </div>

      {/* Leakage Visualizer & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Leakage Breakdown */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/30 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Revenue Leakage Breakdown
              </h3>
              <p className="text-xs text-slate-400">Where store revenue is getting stuck or lost</p>
            </div>
            <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              ₹{(abandonedVal + 18500).toLocaleString('en-IN')} Total At Stake
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-300">Abandoned Carts (Direct Dropoff)</span>
                <span className="text-rose-400 font-bold">₹{abandonedVal.toLocaleString('en-IN')} (42%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-700" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-300">At-Risk Customers (30+ Days Dormant)</span>
                <span className="text-amber-400 font-bold">₹18,500 (35%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: '35%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-300">Unreached VIP Upsells</span>
                <span className="text-blue-400 font-bold">₹12,400 (23%)</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: '23%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-emerald-300">Autopilot Recovery Ready</div>
                <div className="text-slate-400">AI can recover an estimated ₹14,200 with 1 click in Action Center</div>
              </div>
            </div>
          </div>
        </div>

        {/* E-Commerce Funnel */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/30 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" /> Conversion Funnel Health
              </h3>
              <p className="text-xs text-slate-400">Step-by-step visitor progression through checkout</p>
            </div>
            <span className="text-xs font-bold text-violet-400 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
              {convRate}% Net Conversion
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-semibold text-slate-300">1. Storefront Visitors</div>
                <div className="text-slate-500 text-[11px]">Organic & WhatsApp traffic</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">4,820</div>
                <div className="text-[10px] text-slate-400">100%</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-semibold text-slate-300">2. Added to Cart</div>
                <div className="text-slate-500 text-[11px]">Browsed products and added items</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">842</div>
                <div className="text-[10px] text-blue-400">17.5% Add-to-cart</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-semibold text-slate-300">3. Initiated Checkout</div>
                <div className="text-slate-500 text-[11px]">Entered delivery & payment flow</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">310</div>
                <div className="text-[10px] text-amber-400">36.8% Checkout initiation</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-semibold text-emerald-300">4. Paid Orders (Converted)</div>
                <div className="text-emerald-500/80 text-[11px]">Razorpay settled or Demo converted</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">{totalOrders} Orders</div>
                <div className="text-[10px] text-emerald-300 font-bold">{convRate}% Total CR</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Sales Agent Performance */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/30 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">WhatsApp Conversational Commerce Performance</h3>
              <p className="text-xs text-slate-400">Customer interactions handled autonomously by the WhatsApp Sales Agent</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active 24/7
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-1">
            <div className="text-xl font-bold text-white">128</div>
            <div className="text-xs text-slate-400 font-medium">Conversations Handled</div>
            <div className="text-[10px] text-emerald-400 font-semibold">+34 this week</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-1">
            <div className="text-xl font-bold text-emerald-400">46</div>
            <div className="text-xs text-slate-400 font-medium">Carts Created via Chat</div>
            <div className="text-[10px] text-slate-500">35.9% conversation-to-cart rate</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-1">
            <div className="text-xl font-bold text-white">₹{recoveredRev.toLocaleString('en-IN')}</div>
            <div className="text-xs text-slate-400 font-medium">Revenue Generated</div>
            <div className="text-[10px] text-emerald-400 font-semibold">100% Autonomous</div>
          </div>
        </div>
      </div>
    </div>
  );
}
