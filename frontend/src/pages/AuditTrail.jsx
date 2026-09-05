import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  History,
  Bot,
  User,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react';

export function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs({ limit: 100 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActorIcon = (actorType) => {
    switch (actorType) {
      case 'ai_agent':
        return <Bot className="w-4 h-4 text-purple-400" />;
      case 'merchant':
        return <User className="w-4 h-4 text-blue-400" />;
      case 'whatsapp_service':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'razorpay_gateway':
        return <CreditCard className="w-4 h-4 text-cyan-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.event_type.toLowerCase().includes(q) ||
      l.actor_type.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Immutable Governance Audit Trail
            </h1>
            <p className="text-xs text-slate-400">
              Chronological log of every AI analysis, merchant approval, policy verification, WhatsApp dispatch, and payment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadLogs}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs text-slate-400">
          No audit records found matching your query.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
          {filteredLogs.map((log) => (
            <div key={log.id} className="relative pl-6">
              {/* Timeline marker */}
              <div className="absolute -left-3 top-1 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                {getActorIcon(log.actor_type)}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-sm hover:border-slate-700 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={log.status} />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Actor: <span className="text-slate-200 font-semibold">{log.actor_type}</span> ({log.actor_id || 'system'})</span>
                  <span>•</span>
                  <span>Entity: <span className="font-mono text-slate-300">{log.entity_type}:{log.entity_id}</span></span>
                </div>

                {log.input_data && Object.keys(log.input_data).length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/70 text-[11px] font-mono text-slate-300 border border-slate-800/60 overflow-x-auto">
                    <span className="text-slate-500">// Payload Telemetry:</span>
                    <pre className="mt-1">{JSON.stringify(log.input_data, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
