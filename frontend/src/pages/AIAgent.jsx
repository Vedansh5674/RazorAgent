import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Bot,
  Sparkles,
  Send,
  ArrowRight,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Users,
  Layers,
  ShoppingBag,
  MessageSquare,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function AIAgent() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('How can I increase my revenue this week?');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [promotingId, setPromotingId] = useState(null);
  const [promotedActions, setPromotedActions] = useState({});

  const PRESET_QUERIES = [
    {
      label: 'How to increase revenue this week?',
      query: 'How can I increase my revenue this week?'
    },
    {
      label: 'Recover Abandoned Carts',
      query: 'Find all abandoned carts and draft recovery actions with 10% discount'
    },
    {
      label: 'Win-Back At-Risk Customers',
      query: 'Identify at-risk dormant customers and recommend win-back campaigns'
    },
    {
      label: 'Boost Average Order Value',
      query: 'Recommend cross-selling bundles to increase Average Order Value'
    },
    {
      label: 'VIP Customer Retention',
      query: 'Analyze high-value VIP customers and generate early-access offers'
    }
  ];

  const handleQuery = async (queryText) => {
    const q = queryText || prompt;
    if (!q || !q.trim()) return;

    try {
      setAnalyzing(true);
      const res = await api.queryRevenueAgent({ prompt: q });
      setAnalysisResult(res);
    } catch (err) {
      alert(err.message || 'Failed to query AI Revenue Agent');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Initial run on mount with standard merchant prompt
    handleQuery('How can I increase my revenue this week?');
  }, []);

  const handlePromoteToAction = async (opportunity) => {
    try {
      setPromotingId(opportunity.id);
      const res = await api.promoteOpportunityToAction({
        opportunityId: opportunity.id,
        settings: {
          title: opportunity.title,
          reason: opportunity.reason,
          priority: opportunity.priority,
          estimatedImpact: opportunity.estimatedImpact,
          channel: opportunity.channel
        }
      });
      setPromotedActions((prev) => ({ ...prev, [opportunity.id]: res.actionId }));
      alert(`Action created in AI Action Center! Action ID: ${res.actionId}`);
    } catch (err) {
      alert(err.message || 'Failed to create action');
    } finally {
      setPromotingId(null);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
              Core Feature 1
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              Data-Backed Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-purple-400" />
            AI Revenue Agent
          </h1>
          <p className="text-xs text-slate-400">
            Analyzes sales, orders, products, customers, carts, and conversion rates to recommend high-impact revenue actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/action-center"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <span>Open Action Center</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        </div>
      </div>

      {/* Query Bar & Presets */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-slate-900/80 to-blue-950/20 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Ask the AI Revenue Employee
          </label>
          <span className="text-[11px] text-slate-400">
            Real data analysis across products, carts & customer segments
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery(prompt)}
            placeholder="e.g. How can I increase my revenue this week?"
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={() => handleQuery(prompt)}
            disabled={analyzing}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Data...' : 'Analyze & Recommend'}</span>
          </button>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Common Queries:</span>
          {PRESET_QUERIES.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(p.query);
                handleQuery(p.query);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/20 border border-slate-700/60 hover:border-purple-500/40 text-slate-300 hover:text-white text-[11px] transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Business Metrics Telemetry Bar */}
      {analysisResult?.metricsSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Gross Revenue</span>
            <span className="text-lg font-bold text-white block mt-0.5">
              {formatINR(analysisResult.metricsSummary.totalRevenue)}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Potential Opportunity</span>
            <span className="text-lg font-bold text-emerald-400 block mt-0.5">
              {formatINR(analysisResult.metricsSummary.potentialOpportunity)}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Average Order Value</span>
            <span className="text-lg font-bold text-cyan-400 block mt-0.5">
              {formatINR(analysisResult.metricsSummary.averageOrderValue)}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Abandoned Carts</span>
            <span className="text-lg font-bold text-amber-400 block mt-0.5">
              {analysisResult.metricsSummary.abandonedCarts} Checkouts
            </span>
          </div>
        </div>
      )}

      {/* AI Response Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Executive AI Answer Callout */}
          <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/80 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                AI Revenue Executive Recommendation
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                Est. Opportunity: {formatINR(analysisResult.estimatedTotalOpportunity)}
              </span>
            </div>

            <p className="text-sm lg:text-base text-slate-100 leading-relaxed font-medium">
              "{analysisResult.aiSummary}"
            </p>
          </div>

          {/* Structured Opportunity Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Identified Revenue Opportunities ({analysisResult.opportunities?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-400">
                Click action button to approve and route directly to AI Action Center
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {analysisResult.opportunities?.map((opp) => {
                const isPromoted = Boolean(promotedActions[opp.id]);
                const isPromoting = promotingId === opp.id;

                return (
                  <div
                    key={opp.id}
                    className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Card Top Pill Bar */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          opp.priority === 'High'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {opp.priority} Priority
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          +{formatINR(opp.estimatedImpact)} Impact
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white">{opp.title}</h4>

                      {/* Opportunity Statement */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Opportunity:</span>
                        <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                          {opp.opportunity}
                        </p>
                      </div>

                      {/* Reason */}
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Reason:</span>
                        <p className="text-slate-400 leading-relaxed">
                          {opp.reason}
                        </p>
                      </div>

                      {/* Recommended Action */}
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                        <span className="text-[10px] font-mono uppercase text-purple-300 block">Recommended Action:</span>
                        <p className="text-xs text-purple-200 leading-relaxed">
                          {opp.recommendedAction}
                        </p>
                      </div>

                      {/* Channel & Target */}
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Channel: <strong className="text-white">{opp.channel}</strong></span>
                        <span>Target: <strong className="text-white">{opp.targetCustomersCount} Customers</strong></span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      {isPromoted ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Check className="w-4 h-4" /> Added to Action Center
                          </span>
                          <Link
                            to="/action-center"
                            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            View in Center <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePromoteToAction(opp)}
                          disabled={isPromoting}
                          className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <Zap className={`w-3.5 h-3.5 ${isPromoting ? 'animate-spin' : ''}`} />
                          <span>{isPromoting ? 'Adding Action...' : (opp.actionButton || 'Approve & Add to Action Center')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
