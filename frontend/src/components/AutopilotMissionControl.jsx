import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Radio,
  Zap,
  Shield,
  ShieldCheck,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowUpRight,
  Flame,
  Info
} from 'lucide-react';

export function AutopilotMissionControl({ onCycleComplete }) {
  const [settings, setSettings] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [cycleOutcome, setCycleOutcome] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [error, setError] = useState(null);

  // Form local state for sliders
  const [mode, setMode] = useState('SEMI_AUTOPILOT');
  const [threshold, setThreshold] = useState(80);
  const [maxDiscount, setMaxDiscount] = useState(10);
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);

  const fetchMissionData = async () => {
    try {
      const [currSettings, liveEvents] = await Promise.all([
        api.getAutopilotSettings(),
        api.getAutopilotActivityStream(15)
      ]);
      setSettings(currSettings);
      setEvents(liveEvents);
      setMode(currSettings.mode || 'SEMI_AUTOPILOT');
      setThreshold(Math.round((currSettings.auto_approve_threshold || 0.80) * 100));
      setMaxDiscount(Number(currSettings.max_auto_discount || 10));
      const channels = currSettings.channels || ['whatsapp', 'email'];
      setEnableWhatsApp(channels.includes('whatsapp'));
      setEnableEmail(channels.includes('email'));
    } catch (err) {
      console.error('Failed to fetch Autopilot mission control data:', err);
      setError(err.message || 'Failed to load Autopilot configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissionData();
    // Poll telemetry events every 12 seconds
    const interval = setInterval(async () => {
      try {
        const stream = await api.getAutopilotActivityStream(15);
        setEvents(stream);
      } catch (e) {
        // silent fail for polling
      }
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (newMode) => {
    try {
      setSavingSettings(true);
      const updated = await api.updateAutopilotSettings({ mode: newMode });
      setSettings(updated);
      setMode(updated.mode);
      const stream = await api.getAutopilotActivityStream(15);
      setEvents(stream);
    } catch (err) {
      alert(err.message || 'Failed to update Autopilot mode');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTogglePause = async () => {
    if (!settings) return;
    try {
      setSavingSettings(true);
      const updated = await api.updateAutopilotSettings({ is_paused: !settings.is_paused });
      setSettings(updated);
      const stream = await api.getAutopilotActivityStream(15);
      setEvents(stream);
    } catch (err) {
      alert(err.message || 'Failed to toggle pause');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveGuardrails = async () => {
    try {
      setSavingSettings(true);
      const channels = [];
      if (enableWhatsApp) channels.push('whatsapp');
      if (enableEmail) channels.push('email');
      if (channels.length === 0) channels.push('email'); // at least one channel

      const updated = await api.updateAutopilotSettings({
        mode,
        auto_approve_threshold: threshold / 100,
        max_auto_discount: maxDiscount,
        channels
      });
      setSettings(updated);
      setShowConfig(false);
      const stream = await api.getAutopilotActivityStream(15);
      setEvents(stream);
    } catch (err) {
      alert(err.message || 'Failed to save guardrails');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerCycle = async () => {
    try {
      setRunningCycle(true);
      setCycleOutcome(null);
      const result = await api.triggerAutopilotCycle();
      setCycleOutcome(result);
      const stream = await api.getAutopilotActivityStream(15);
      setEvents(stream);
      if (onCycleComplete) {
        onCycleComplete(result);
      }
    } catch (err) {
      alert(err.message || 'Failed to execute Autopilot cycle');
    } finally {
      setRunningCycle(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-center text-slate-400 gap-3">
        <RotateCcw className="w-5 h-5 animate-spin text-cyan-400" />
        <span className="text-xs">Initializing Autopilot Mission Control...</span>
      </div>
    );
  }

  const isPaused = Boolean(settings?.is_paused);
  const currentMode = settings?.mode || 'SEMI_AUTOPILOT';

  return (
    <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border border-cyan-500/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Top Mission Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              {/* Radar Status Beacon */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isPaused
                      ? 'bg-amber-500'
                      : currentMode === 'FULL_AUTOPILOT'
                      ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                      : 'bg-cyan-400 shadow-[0_0_12px_#38bdf8]'
                  }`}
                />
                {!isPaused && (
                  <span
                    className={`absolute w-6 h-6 rounded-full animate-ping opacity-75 ${
                      currentMode === 'FULL_AUTOPILOT' ? 'bg-emerald-400/50' : 'bg-cyan-400/50'
                    }`}
                  />
                )}
              </div>

              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>AI Revenue Autopilot</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono uppercase font-bold">
                  Mission Control
                </span>
              </h2>

              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                  isPaused
                    ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                    : currentMode === 'FULL_AUTOPILOT'
                    ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                    : 'bg-cyan-900/40 text-cyan-300 border border-cyan-700/50'
                }`}
              >
                {isPaused ? 'Engine Paused' : `${currentMode.replace('_', ' ')} ACTIVE`}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Autonomous 24/7 recovery engine: scans abandoned checkouts, validates policy guardrails, and recovers revenue hands-free.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Guardrails</span>
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleTogglePause}
              disabled={savingSettings}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isPaused
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{isPaused ? 'Resume Autopilot' : 'Emergency Pause'}</span>
            </button>

            <button
              onClick={handleTriggerCycle}
              disabled={runningCycle || isPaused}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-900/30 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${runningCycle ? 'animate-spin' : ''}`} />
              <span>{runningCycle ? 'Engine Cycling...' : 'Trigger Autopilot Cycle'}</span>
            </button>
          </div>
        </div>

        {/* 3 Autopilot Mode Switches */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Mode 1: Manual Assist */}
          <button
            onClick={() => handleModeChange('MANUAL_ASSIST')}
            disabled={savingSettings}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              currentMode === 'MANUAL_ASSIST'
                ? 'bg-slate-800/90 border-blue-500/70 shadow-md shadow-blue-950/40'
                : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                1. Manual Assist
              </span>
              {currentMode === 'MANUAL_ASSIST' && (
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              AI discovers checkout leaks & prepares interventions. Merchant manually approves every action in Queue.
            </p>
          </button>

          {/* Mode 2: Semi-Autopilot (Recommended) */}
          <button
            onClick={() => handleModeChange('SEMI_AUTOPILOT')}
            disabled={savingSettings}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
              currentMode === 'SEMI_AUTOPILOT'
                ? 'bg-cyan-950/30 border-cyan-500/70 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                2. Semi-Autopilot
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">REC</span>
              </span>
              {currentMode === 'SEMI_AUTOPILOT' && (
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Auto-dispatches safe, high-confidence (≥{threshold}%) recoveries under {maxDiscount}% discount cap. Outliers held for review.
            </p>
          </button>

          {/* Mode 3: Full Autopilot */}
          <button
            onClick={() => handleModeChange('FULL_AUTOPILOT')}
            disabled={savingSettings}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
              currentMode === 'FULL_AUTOPILOT'
                ? 'bg-emerald-950/30 border-emerald-500/70 shadow-md shadow-emerald-950/40'
                : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                3. Full Autopilot
              </span>
              {currentMode === 'FULL_AUTOPILOT' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              24/7 autonomous recovery. Automatically dispatches WhatsApp & Email to all eligible abandoned carts instantly.
            </p>
          </button>
        </div>
      </div>

      {/* Expandable Guardrails Configuration Drawer */}
      {showConfig && (
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Autonomous Policy Guardrails & Dispatch Channels
            </h3>
            <span className="text-[11px] text-slate-400">Strictly enforced on every cycle</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Threshold Slider */}
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Auto-Approve Confidence</span>
                <span className="font-mono text-cyan-400 font-bold">{threshold}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="95"
                step="5"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[10px] text-slate-400">
                Opportunities scoring below {threshold}% confidence are safely held for manual review.
              </p>
            </div>

            {/* Discount Cap */}
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Max Auto Discount Cap</span>
                <span className="font-mono text-cyan-400 font-bold">{maxDiscount}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="2"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[10px] text-slate-400">
                AI will never exceed {maxDiscount}% discount automatically, preserving gross margin.
              </p>
            </div>

            {/* Channels Checklist */}
            <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300 font-medium block">Dispatch Channels</span>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableWhatsApp}
                    onChange={(e) => setEnableWhatsApp(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Cloud Recovery</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmail}
                    onChange={(e) => setEnableEmail(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email Recovery Templates</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGuardrails}
              disabled={savingSettings}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Apply Guardrails'}
            </button>
          </div>
        </div>
      )}

      {/* Cycle Execution Result Toast/Banner */}
      {cycleOutcome && (
        <div className="px-6 py-3 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-cyan-950/40 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Autopilot Cycle Executed:</span>
            <span>
              {cycleOutcome.autoApproved} checkouts auto-recovered (₹{Number(cycleOutcome.recoveredProjectedValue || 0).toLocaleString('en-IN')})
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">{cycleOutcome.heldForManualReview} held for manual review</span>
            {cycleOutcome.blockedByGuardrail > 0 && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-amber-400">{cycleOutcome.blockedByGuardrail} guardrail blocked</span>
              </>
            )}
          </div>

          <button
            onClick={() => setCycleOutcome(null)}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Real-time Telemetry & KPIs */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4 Autonomous Telemetry KPI Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              Operational Mode
            </span>
            <span className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              {currentMode.replace('_', ' ')}
            </span>
            <span className="text-[11px] text-emerald-400 block mt-1">
              ● 24/7 Autonomous Scanner
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              Policy Guardrails
            </span>
            <span className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active & Protected
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Cap: {maxDiscount}% • Consent Enforced
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              Multi-Channel Matrix
            </span>
            <span className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" />
              {(settings?.channels || ['whatsapp', 'email']).join(' + ').toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Auto-sync WhatsApp & Email
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              AI Confidence Gate
            </span>
            <span className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              ≥{threshold}% Required
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Low-confidence routed to Queue
            </span>
          </div>
        </div>

        {/* Right Column: Live Event Stream Terminal */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Mission Telemetry Stream</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Auto-refreshing • {events.length} Events
            </span>
          </div>

          <div className="p-3 max-h-56 overflow-y-auto space-y-2 font-mono text-xs">
            {events.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                No events recorded yet. Trigger a cycle to see real-time autonomous execution.
              </div>
            ) : (
              events.map((evt) => {
                const isSuccess = evt.severity === 'success' || evt.event_type === 'OPPORTUNITY_AUTO_APPROVED';
                const isWarn = evt.severity === 'warning' || evt.event_type === 'GUARDRAIL_BLOCKED';
                const timeStr = new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div
                    key={evt.id}
                    className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/60 flex items-start gap-2.5 hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-[10px] text-slate-400 shrink-0 pt-0.5">
                      {timeStr}
                    </span>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-bold shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : isWarn
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {evt.event_type}
                    </span>

                    <span className="text-slate-300 text-[11px] leading-relaxed flex-1">
                      {evt.summary}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
