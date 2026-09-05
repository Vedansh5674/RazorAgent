import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  Clock,
  Send,
  Zap,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ArrowRight,
  PlusCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [segmentCounts, setSegmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignSegment, setCampaignSegment] = useState('At-Risk Customers');
  const [campaignDiscount, setCampaignDiscount] = useState(10);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  const loadCustomers = async (segment = selectedSegment) => {
    try {
      setLoading(true);
      const res = await api.getCustomers(segment);
      setCustomers(res.customers || []);
      setSegmentCounts(res.segmentCounts || {});
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(selectedSegment);
  }, [selectedSegment]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      setSubmittingCampaign(true);
      const res = await api.createCustomerCampaign({
        segment: campaignSegment,
        campaignTitle: campaignTitle || `${campaignSegment} Re-engagement Campaign`,
        discountPercent: Number(campaignDiscount),
        channel: 'WhatsApp'
      });
      setCampaignModalOpen(false);
      alert(`${res.message || 'Campaign created successfully in AI Action Center!'}`);
      navigate('/action-center');
    } catch (err) {
      alert(err.message || 'Failed to create campaign');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const segmentsList = [
    'All',
    'New Customers',
    'Loyal Customers',
    'VIP Customers',
    'High-Value Customers',
    'At-Risk Customers',
    'Churned Customers',
    'High-Intent Customers'
  ];

  const getSegmentBadgeStyle = (seg) => {
    switch (seg) {
      case 'VIP Customers':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Loyal Customers':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'High-Value Customers':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'At-Risk Customers':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Churned Customers':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'High-Intent Customers':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold">
              Core Feature 3
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              AI Customer Segmentation
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            Customers & Smart Revenue Cohorts
          </h1>
          <p className="text-xs text-slate-400">
            Intelligently identifies New, Loyal, VIP, High-Value, At-Risk, Churned, and High-Intent shoppers to maximize Customer Lifetime Value.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCampaignSegment(selectedSegment === 'All' ? 'At-Risk Customers' : selectedSegment);
              setCampaignModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Create Segment Campaign</span>
          </button>
          <button
            onClick={() => loadCustomers(selectedSegment)}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Segment Filter Chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {segmentsList.map((seg) => {
            const count = segmentCounts[seg] ?? 0;
            const isSelected = selectedSegment === seg;
            return (
              <button
                key={seg}
                onClick={() => setSelectedSegment(seg)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span>{seg}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Selected Segment Insight Banner */}
      <div className="p-5 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950/30 via-slate-900/60 to-slate-950 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold text-blue-400">
            Active Segment Intelligence: {selectedSegment}
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedSegment === 'At-Risk Customers' && 'Dormant buyers who made purchases previously but have been inactive for 40+ days. High reactivation propensity with a 10% perk.'}
            {selectedSegment === 'VIP Customers' && 'Highest-spending advocates responsible for outsized gross margin. Perfect for early-access drops and high-touch VIP support.'}
            {selectedSegment === 'High-Intent Customers' && 'Active shopping intent with recent cart activity. Immediate automated WhatsApp follow-up recovers up to 68% of orders.'}
            {selectedSegment === 'Loyal Customers' && 'Frequent repeat purchasers with high brand trust. Target with loyalty incentives and multi-product bundles.'}
            {selectedSegment === 'New Customers' && 'First-time shoppers exploring catalog items. Target with welcoming onboarding and curated best-sellers.'}
            {selectedSegment === 'Churned Customers' && 'Inactive for 90+ days. Win back with deep 15% discount incentive before permanent drop-off.'}
            {selectedSegment === 'High-Value Customers' && 'Shoppers with top-tier average order values. Recommend complementary premium accessories.'}
            {selectedSegment === 'All' && 'Holistic view across all registered and shopping customer profiles.'}
          </p>
        </div>

        <button
          onClick={() => {
            setCampaignSegment(selectedSegment === 'All' ? 'At-Risk Customers' : selectedSegment);
            setCampaignModalOpen(true);
          }}
          className="shrink-0 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Segment</th>
                <th className="py-3.5 px-4">Orders & Spent</th>
                <th className="py-3.5 px-4">Est. LTV</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4">Recommended Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customers found matching this segment filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">{cust.email}</div>
                      <div className="text-[11px] font-mono text-slate-500">{cust.phone}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getSegmentBadgeStyle(cust.segment)}`}>
                        {cust.segment}
                      </span>
                      {cust.whatsappOptedIn ? (
                        <span className="text-[10px] text-emerald-400 block mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> WhatsApp Opted-In
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 block mt-1 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Opted-Out
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 space-y-0.5">
                      <div className="text-white font-bold">{cust.totalOrders} Orders</div>
                      <div className="text-slate-300 font-mono">{formatINR(cust.totalSpending)}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-emerald-400 font-mono text-sm">
                        {formatINR(cust.estimatedLtv)}
                      </div>
                      <div className="text-[10px] text-slate-400">Predicted Life Value</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-slate-300 font-medium">
                        {new Date(cust.lastPurchaseDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {cust.daysSinceLastOrder} days ago
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {cust.recommendedNextAction}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {campaignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCampaign} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Campaign Generator</span>
                <h3 className="text-sm font-bold text-white">Create Segment Revenue Campaign</h3>
              </div>
              <button
                type="button"
                onClick={() => setCampaignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Target Customer Segment</label>
                <select
                  value={campaignSegment}
                  onChange={(e) => setCampaignSegment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  {segmentsList.filter(s => s !== 'All').map(s => (
                    <option key={s} value={s}>{s} ({segmentCounts[s] || 0} customers)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  placeholder={`e.g. ${campaignSegment} Win-back Initiative`}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Incentive Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={campaignDiscount}
                  onChange={(e) => setCampaignDiscount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">Guarded by merchant 10% default policy.</p>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Channel</label>
                <input
                  type="text"
                  disabled
                  value="WhatsApp (High-Converting Personalized Broadcast)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCampaignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCampaign}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-950/40 cursor-pointer disabled:opacity-50"
              >
                {submittingCampaign ? 'Adding...' : 'Post to AI Action Center'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
