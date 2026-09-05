import React, { useState } from 'react';
import { api } from '../services/api';
import { CheckCircle2, Play, RefreshCw, AlertCircle, X, ShieldAlert, Zap } from 'lucide-react';

export function DemoRunnerModal({ isOpen, onClose, onScenarioComplete }) {
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRunScenario = async () => {
    setRunning(true);
    setError(null);
    setResults(null);
    setActiveStep(1);

    try {
      // Step interval animation for realistic visual demonstration
      const interval = setInterval(() => {
        setActiveStep(prev => (prev < 6 ? prev + 1 : prev));
      }, 450);

      const response = await api.runDemoScenario();
      clearInterval(interval);
      setActiveStep(7);
      setResults(response);
      if (onScenarioComplete) onScenarioComplete(response);
    } catch (err) {
      setError(err.message || 'Failed to complete demo scenario.');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    try {
      await api.resetDemo();
      setResults(null);
      setActiveStep(0);
      alert('Demo database reset to clean seeded state.');
      if (onScenarioComplete) onScenarioComplete();
    } catch (err) {
      setError(err.message || 'Failed to reset demo state.');
    } finally {
      setResetting(false);
    }
  };

  const stepsList = [
    { title: 'Detect Abandoned Checkout', desc: 'Identifies unpaid carts with customer WhatsApp consent.' },
    { title: 'AI Agent Telemetry Analysis', desc: 'Evaluates cart value, customer LTV, and policy limits.' },
    { title: 'Explainable Recommendation', desc: 'Proposes compliant discount under merchant policy limit.' },
    { title: 'Merchant Governance Approval', desc: 'Merchant approves recovery action and verifies policies.' },
    { title: 'WhatsApp Template Delivery', desc: 'Sends approved cart_recovery template with checkout URL.' },
    { title: 'Razorpay Test Payment', desc: 'Simulates customer return and verifies HMAC-SHA256 signature.' },
    { title: 'Revenue Recovered & Converted', desc: 'Updates order to paid, converts opportunity, and logs audit.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">RazorAgent Buildathon Demo Runner</h3>
              <p className="text-xs text-slate-400">Execute the complete autonomous recovery journey in seconds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Steps Progress */}
        <div className="mt-6 space-y-3 max-h-80 overflow-y-auto pr-2">
          {stepsList.map((step, idx) => {
            const stepNum = idx + 1;
            const isDone = activeStep >= stepNum;
            const isCurrent = activeStep === stepNum && running;

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : isCurrent
                    ? 'bg-blue-500/10 border-blue-500/30 animate-pulse'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {stepNum}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold ${isDone ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results Box */}
        {results && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            <div className="font-bold text-sm mb-1">🎉 Scenario Completed Successfully!</div>
            <p>
              Customer <span className="font-semibold text-white">{results.summary.customer}</span> returned via WhatsApp,
              paid order <span className="font-semibold text-white">{results.summary.orderNumber}</span>, and recovered{' '}
              <span className="font-bold text-white">₹{results.summary.recoveredRevenue.toLocaleString('en-IN')}</span>!
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={handleReset}
            disabled={resetting || running}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            Reset State
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleRunScenario}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Executing Scenario...' : 'Run Demo Scenario'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
