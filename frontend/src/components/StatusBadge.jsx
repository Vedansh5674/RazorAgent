import React from 'react';

export function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  const styles = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    pending_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    executed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sent: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    read: 'bg-green-500/10 text-green-400 border-green-500/20',
    converted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    captured: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    abandoned: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  const currentStyle = styles[normalized] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${currentStyle}`}>
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
}
