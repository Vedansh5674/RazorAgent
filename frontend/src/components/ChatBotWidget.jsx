import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  ChevronDown,
  Minimize2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export function openChatbot(prompt = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { prompt } }));
  }
}

export function ChatBotWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const messagesEndRef = useRef(null);

  // Detect context: Customer checkout page vs Merchant Admin portal
  const isCheckout = location.pathname.startsWith('/checkout');
  const cartTokenMatch = location.pathname.match(/\/checkout\/([^/?#]+)/);
  const cartToken = cartTokenMatch ? cartTokenMatch[1] : null;
  const context = isCheckout ? 'customer' : 'merchant';

  const defaultGreeting = isCheckout
    ? {
        role: 'assistant',
        title: 'Checkout Concierge',
        content: `👋 Hi there! I'm your Shopping Assistant for **TrendVault India**.\n\nNeed help completing your order or having issues with payment? Ask me anything about UPI/Card payment, your applied discount, delivery, or returns!`,
        actionSuggestions: [
          { label: '💳 How do I pay with UPI or Cards?', action: 'show_methods' },
          { label: '💰 Is my recovery discount applied?', action: 'check_discount' },
          { label: '📦 When will my order be delivered?', action: 'check_delivery' },
          { label: '🔄 What is your return & refund policy?', action: 'check_refund' }
        ]
      }
    : {
        role: 'assistant',
        title: 'Merchant Copilot',
        content: `👋 Welcome! I'm your **RazorAgent Support Copilot**.\n\nI can help you troubleshoot policies, inspect payment webhooks, optimize WhatsApp recovery, or configure Razorpay test keys!`,
        actionSuggestions: [
          { label: '🛡️ Why was an action blocked by policy?', action: 'explain_policy' },
          { label: '🔑 How to verify Razorpay webhooks?', action: 'explain_webhook' },
          { label: '📲 How does WhatsApp opt-in work?', action: 'explain_whatsapp' },
          { label: '📊 How is recovery confidence calculated?', action: 'explain_propensity' }
        ]
      };

  useEffect(() => {
    // Reset or set initial greeting based on context
    setMessages([defaultGreeting]);
    // Fetch FAQs
    api.getChatFaqs(context)
      .then(res => setFaqs(Array.isArray(res) ? res : (res?.data || [])))
      .catch(() => setFaqs([]));
  }, [context]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        // Automatically send the prompt after opening
        setTimeout(() => {
          handleSendMessage(e.detail.prompt);
        }, 100);
      }
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('open-chatbot', handleOpenChat);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('open-chatbot', handleOpenChat);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim()) return;

    const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const response = await api.sendChatMessage({
        message: text.trim(),
        context,
        cartToken,
        history
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          title: response.title || (isCheckout ? 'Checkout Concierge' : 'Merchant Copilot'),
          content: response.content,
          actionSuggestions: response.actionSuggestions || [],
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          title: 'Support Assistant',
          content: `I encountered an error processing that: ${err.message || 'Network error'}. Please retry or check your connection.`,
          actionSuggestions: [{ label: 'Retry Question', action: 'retry' }],
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([defaultGreeting]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* ========================================================================= */}
      {/* 🟢 LAUNCHER BUTTON */}
      {/* ========================================================================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-purple-600/40 border border-purple-400/30 hover:scale-105 transition-all duration-300"
          aria-label="Open AI Support Chat"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold tracking-tight">Need Help?</div>
            <div className="text-[10px] text-purple-200">
              {isCheckout ? 'Ask Shopping AI' : 'Chat with Copilot'}
            </div>
          </div>
        </button>
      )}

      {/* ========================================================================= */}
      {/* 💬 EXPANDED CHAT WINDOW */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] bg-slate-950/95 border border-purple-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-slate-900/80 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  RazorAgent AI Support
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-purple-200">
                  {isCheckout ? 'Customer Checkout Concierge' : 'Merchant AI Copilot'} • 24/7 Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Reset conversation"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                      : 'bg-slate-900/80 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-inner'
                  }`}
                >
                  {msg.role === 'assistant' && msg.title && (
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {msg.title}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.content}
                  </div>

                  {/* Suggestion Chips */}
                  {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] text-slate-400 font-semibold">Suggested Questions:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.actionSuggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug.label.replace(/^[^\w\s]+/, '').trim())}
                            className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-[10px] text-purple-300 hover:text-white transition-all text-left"
                          >
                            {sug.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 ml-1">AI Assistant is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Starters */}
          {messages.length <= 2 && faqs.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/60">
              <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">Common FAQs:</div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {faqs.slice(0, 3).map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(faq.q)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white shrink-0 transition-all"
                  >
                    {faq.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900/90 border-t border-purple-500/20 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isCheckout ? "Ask about payment, discount, or delivery..." : "Ask about policies, webhooks, or recovery..."}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md shadow-purple-600/30 disabled:opacity-40 transition-all shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
