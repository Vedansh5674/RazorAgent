import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const colorMap = {
    blue: 'from-blue-500/10 to-indigo-500/5 text-blue-400 border-blue-500/20',
    green: 'from-emerald-500/10 to-teal-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-400 border-amber-500/20',
    purple: 'from-purple-500/10 to-pink-500/5 text-purple-400 border-purple-500/20'
  };

  const iconBg = {
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-emerald-500/15 text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-400',
    purple: 'bg-purple-500/15 text-purple-400'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-xl transition-all hover:scale-[1.01] ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg[color] || iconBg.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-3xl font-extrabold tracking-tight text-white">{value}</h3>
        {trend && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
