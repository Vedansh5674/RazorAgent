import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  Users,
  Package,
  MessageSquare,
  ShoppingBag,
  BarChart3,
  Mail,
  History,
  Settings
} from 'lucide-react';
import { openChatbot } from './ChatBotWidget';

export function Sidebar() {
  const coreNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/ai-agent', label: 'AI Revenue Agent', icon: Bot },
    { to: '/action-center', label: 'AI Action Center', icon: CheckSquare },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/whatsapp-agent', label: 'WhatsApp Agent', icon: MessageSquare },
    { to: '/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const secondaryNavItems = [
    { to: '/email-communications', label: 'Email Outreach', icon: Mail },
    { to: '/audit-trail', label: 'Audit Trail', icon: History },
    { to: '/settings', label: 'Policy & Guardrails', icon: Settings }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/60 p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3.5 mb-2">
            Core Revenue Engine
          </div>
          <nav className="space-y-1">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3.5 mb-2">
            Operations & Controls
          </div>
          <nav className="space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-300'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        {/* Dedicated Chatbot Trigger Option */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 to-slate-900/60 p-3 text-xs shadow-lg shadow-purple-950/20">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-purple-200 flex items-center gap-1.5 text-xs">
              <Bot className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> AI Copilot Chat
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-semibold">
              Live
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            Troubleshoot policies, webhooks, or test payments with AI.
          </p>
          <button
            onClick={() => openChatbot()}
            className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 transition-all"
          >
            <MessageSquare className="w-3 h-3" />
            Open Chatbot
          </button>
        </div>

        {/* Built for Buildathon badge */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-2.5 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-[11px] mb-0.5">
            <Bot className="w-3.5 h-3.5" /> Agentic Commerce
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            AI Revenue Autopilot • WhatsApp Sales Agent + Checkout
          </p>
        </div>
      </div>
    </aside>
  );
}
