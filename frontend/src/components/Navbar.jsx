import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Play, Sparkles, LogOut, Store, Bell, CheckCircle2, ShieldCheck, Bot, MessageCircle } from 'lucide-react';
import { DemoRunnerModal } from './DemoRunnerModal';
import { openChatbot } from './ChatBotWidget';

export function Navbar({ onRefreshData }) {
  const { user, merchant, logout } = useAuth();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                RazorAgent <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">BUILDATHON</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-6 border-l border-slate-800 text-xs text-slate-400">
            <Store className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-200">{merchant?.store_name || 'TrendVault India'}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Test Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dedicated AI Support Chatbot Button */}
          <button
            onClick={() => openChatbot()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition-all shadow-sm group"
            title="Open AI Support Chatbot (Ctrl+K)"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400 group-hover:animate-bounce" />
            <span>AI Assistant</span>
            <span className="text-[10px] text-purple-400 font-mono bg-purple-900/60 px-1.5 py-0.5 rounded hidden sm:inline">Ctrl+K</span>
          </button>

          {/* Quick Demo Scenario Runner Button */}
          <button
            onClick={() => setDemoModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 transition-all shadow-md shadow-blue-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run Demo Scenario</span>
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">{user?.name || 'Vikramaditya'}</div>
              <div className="text-[10px] text-slate-400">{user?.role || 'merchant_admin'}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <DemoRunnerModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onScenarioComplete={() => {
          if (onRefreshData) onRefreshData();
        }}
      />
    </>
  );
}
