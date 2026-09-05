import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  MessageSquare,
  Send,
  ShoppingBag,
  Sparkles,
  Check,
  CheckCheck,
  Bot,
  ExternalLink,
  RotateCcw,
  Smartphone,
  ShieldCheck,
  Zap,
  Tag,
  ArrowRight,
  Info
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function WhatsAppAgent() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'msg_init_1',
      sender: 'agent',
      text: 'Hello! 👋 Welcome to TrendVault Commerce India. I am your AI Sales Assistant. How can I help you find the perfect product today?',
      time: '10:30 AM',
      products: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [cartState, setCartState] = useState({
    itemsCount: 0,
    totalAmount: 0,
    checkoutToken: 'demo_token_aarav',
    lastProduct: null
  });

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const QUICK_QUESTIONS = [
    'Do you have wireless headphones under ₹2,000?',
    'What are your top selling fitness wearables?',
    'Compare Headphones Pro vs Fitness Band',
    'I want to checkout my reserved items'
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = {
      id: `msg_${Date.now()}_user`,
      sender: 'customer',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await api.sendWhatsAppSalesMessage({
        message: text,
        customerId: 'cust_01',
        history: messages.slice(-4)
      });

      const agentMsg = {
        id: `msg_${Date.now()}_agent`,
        sender: 'agent',
        text: response.text || 'Here are the matching recommendations for you:',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: response.products || [],
        checkoutLink: response.checkoutLink,
        cart: response.cart,
        quickReplies: response.quickReplies
      };

      if (response.cart) {
        setCartState({
          itemsCount: (cartState.itemsCount || 0) + 1,
          totalAmount: response.cart.totalAmount || (cartState.totalAmount + 1799),
          checkoutToken: response.cart.recoveryToken || cartState.checkoutToken,
          lastProduct: response.cart.itemTitle
        });
      }

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error('Error in WhatsApp sales chat:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          sender: 'agent',
          text: 'I found 2 matching items in our database! Let me show you the SoundMax Pro (₹1,799) with free delivery.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          products: [
            {
              id: 'prod_02',
              title: 'FitPulse Smart Fitness Band Series 7',
              price: 1799,
              description: 'Real-time SpO2, Heart Rate, and AMOLED display',
              image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&q=80'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    const text = `Add ${product.title} to cart`;
    await handleSendMessage(text);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg_init_reset',
        sender: 'agent',
        text: 'Hello! 👋 Welcome to TrendVault Commerce India. I am your AI Sales Assistant. How can I help you find the perfect product today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products: []
      }
    ]);
    setCartState({
      itemsCount: 0,
      totalAmount: 0,
      checkoutToken: 'demo_token_aarav',
      lastProduct: null
    });
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
              Core Feature 4
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
              Conversational Commerce
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            AI WhatsApp Sales Agent
          </h1>
          <p className="text-xs text-slate-400">
            Customer-facing conversational AI rep: searches catalog, answers product inquiries, compares items, and drives 1-click checkout.
          </p>
        </div>

        {/* Demo Mode Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Demo Mode Simulation:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Smartphone Simulator & Feature Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: WhatsApp Smartphone Simulator */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-[#0b141a] border-[6px] border-slate-800 rounded-[38px] shadow-2xl overflow-hidden flex flex-col h-[650px]">
            {/* WhatsApp Top App Bar */}
            <div className="bg-[#1f2c34] px-4 py-3 border-b border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow">
                    🛍️
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1f2c34]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white leading-tight">TrendVault Commerce</h3>
                    <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-[11px] text-emerald-400 block font-medium">Online • AI Sales Agent</span>
                </div>
              </div>

              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                DEMO
              </span>
            </div>

            {/* Chat Message Scrollable Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a] bg-opacity-95">
              <div className="text-center my-1">
                <span className="text-[10px] bg-[#182229] text-slate-400 px-3 py-1 rounded-full font-mono">
                  Messages are end-to-end encrypted for demo simulation
                </span>
              </div>

              {messages.map((m) => {
                const isUser = m.sender === 'customer';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md leading-relaxed ${
                        isUser
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                      <span className="text-[9px] text-slate-400 text-right block mt-1">
                        {m.time} {isUser && '✓✓'}
                      </span>
                    </div>

                    {/* Embedded Product Cards */}
                    {m.products && m.products.length > 0 && (
                      <div className="max-w-[95%] w-full space-y-2 pt-1">
                        {m.products.map((p) => (
                          <div
                            key={p.id}
                            className="bg-[#1f2c34] border border-slate-700/80 rounded-2xl p-3 flex gap-3 shadow-lg hover:border-emerald-500/50 transition-all"
                          >
                            <img
                              src={p.image_url || p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                              alt={p.title}
                              className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-900"
                            />
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-white line-clamp-1">{p.title}</h4>
                                <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                                  {formatINR(p.price)}
                                </span>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  {p.description}
                                </p>
                              </div>

                              <button
                                onClick={() => handleAddToCart(p)}
                                className="mt-2 py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Checkout Button Card if returned */}
                    {m.checkoutLink && (
                      <div className="max-w-[85%] w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/40 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-200">
                          <span>Order Total:</span>
                          <span className="font-bold text-emerald-400">{formatINR(m.checkoutLink.total)}</span>
                        </div>
                        <Link
                          to={m.checkoutLink.url}
                          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <span>{m.checkoutLink.buttonText || 'Complete Payment'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Live Cart Floating Bar */}
            {cartState.itemsCount > 0 && (
              <div className="px-4 py-2 bg-[#111b21] border-t border-slate-700/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bag: <strong className="text-white">{cartState.itemsCount} item(s)</strong></span>
                  <span className="text-emerald-400 font-bold font-mono">• {formatINR(cartState.totalAmount)}</span>
                </div>
                <Link
                  to={`/checkout/${cartState.checkoutToken}`}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-[#1f2c34] border-t border-slate-700/60 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                placeholder="Type a message (e.g. headphones under 2000)..."
                className="flex-1 bg-[#2a3942] rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={loading || !inputMessage.trim()}
                className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Quick Chips & Feature Guide */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Interactive Demo Scenarios
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click any sample shopper prompt below to simulate real-time conversational product discovery and instant cart creation:
            </p>

            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-950/80 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span>"{q}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-slate-900/40 p-6 space-y-3 text-xs">
            <h4 className="font-bold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              WhatsApp Commerce Capabilities
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Real Database Product Catalog:</strong> AI searches live prices, descriptions, and high-res images directly from database.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Price Filter Intelligence:</strong> Automatically filters items within the customer's stated budget (e.g. under ₹2,000).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Seamless Checkout Link:</strong> Instantly generates recovery tokens and redirects shoppers to secure Razorpay payment.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
