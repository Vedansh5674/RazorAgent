import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Bot,
  MessageCircle,
  HelpCircle,
  Mail,
  Send,
  X
} from 'lucide-react';
import { openChatbot } from '../components/ChatBotWidget';

export function CheckoutSimulator() {
  const { token } = useParams();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Email Store Owner Inquiry State
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    async function loadCart() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCartByToken(token);
        setCartData(data);
      } catch (err) {
        setError(err.message || 'Unable to retrieve recovery checkout.');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadCart();
  }, [token]);

  const handleRazorpayPayment = async (simulateOutcome = 'success') => {
    try {
      setPaying(true);
      setError(null);

      // 1. Create Razorpay Test Order on Backend
      const orderData = await api.createOrder({
        cartId: cartData.cartId,
        merchantId: cartData.merchantId,
        amount: cartData.finalTotal,
        currency: cartData.currency,
        customerId: cartData.customerId,
        notes: {
          recoverySource: 'whatsapp_agent',
          discountAmount: cartData.discountAmount
        }
      });

      // 2. Open Razorpay Standard Checkout Popup if Razorpay SDK loaded
      if (typeof window.Razorpay !== 'undefined' && orderData.key && !orderData.key.includes('Demo') && simulateOutcome === 'success') {
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: cartData.merchantName || 'TrendVault India',
          description: 'AI Cart Recovery Test Mode Checkout',
          order_id: orderData.razorpayOrderId,
          prefill: {
            name: cartData.customerName,
            email: cartData.customerEmail,
            contact: cartData.customerPhone
          },
          theme: { color: '#2563eb' },
          handler: async function (response) {
            try {
              const verifyRes = await api.verifyPayment({
                merchantId: cartData.merchantId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                method: 'upi'
              });
              setPaymentSuccess(verifyRes);
            } catch (vErr) {
              setError(vErr.message || 'Payment signature verification failed.');
            } finally {
              setPaying(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPaying(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // Simulated Test Payment Execution (Offline or Demo Sandbox)
      if (simulateOutcome === 'failure') {
        throw new Error('Simulated Razorpay error: Card declined / Insufficient test funds');
      }

      const simulatedPaymentId = `pay_rzptest_${Date.now().toString().slice(-8)}`;
      const verifyRes = await api.verifyPayment({
        merchantId: cartData.merchantId,
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayPaymentId: simulatedPaymentId,
        razorpaySignature: 'sig_demo_hash_verified',
        method: 'upi'
      });

      setPaymentSuccess(verifyRes);
    } catch (err) {
      setError(err.message || 'Payment failed.');
    } finally {
      setPaying(false);
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryMsg.trim()) return;

    try {
      setInquirySubmitting(true);
      await api.submitClientInquiry({
        merchantId: cartData?.merchantId || 'merchant_trendvault_01',
        customerName: cartData?.customerName || 'Aarav Sharma',
        customerEmail: cartData?.customerEmail || 'aarav.sharma@example.com',
        customerPhone: cartData?.customerPhone || '+919876543210',
        message: inquiryMsg,
        cartToken: token,
        cartValue: cartData?.finalTotal || cartData?.totalAmount
      });
      setInquirySent(true);
      setInquiryMsg('');
      setTimeout(() => {
        setInquirySent(false);
        setShowInquiryModal(false);
      }, 3000);
    } catch (err) {
      alert(err.message || 'Failed to submit inquiry.');
    } finally {
      setInquirySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !cartData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Cart Recovery Link Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The token <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">{token}</code> could not be located or has expired.
          </p>
          <div className="pt-2 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Load an Active Demo Checkout:
            </span>
            <Link
              to="/checkout/recov_tok_aarav_4298"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-blue-400 text-xs font-bold transition-all text-left"
            >
              <span>Aarav Sharma — Royal Silk Bandhgala</span>
              <span className="font-mono">₹4,298 &rarr;</span>
            </Link>
            <Link
              to="/checkout/recov_tok_priya_3298"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 hover:text-white border border-purple-500/30 text-purple-400 text-xs font-bold transition-all text-left"
            >
              <span>Priya Patel — Banarasi Brocade Saree</span>
              <span className="font-mono">₹3,298 &rarr;</span>
            </Link>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white">
              &larr; Return to Merchant Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Recovered Checkout
            </span>
            <h1 className="text-lg font-black text-white mt-1">
              {cartData?.merchantName || 'TrendVault India'}
            </h1>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit Razorpay SSL</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Card */}
        {paymentSuccess ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-8 text-center space-y-4 shadow-2xl shadow-emerald-500/10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Payment Completed!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your order has been confirmed and settled in Razorpay Test Mode.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-left">
              <div className="flex justify-between text-slate-400">
                <span>Order Number:</span>
                <span className="font-mono font-bold text-white">{paymentSuccess.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{Number(paymentSuccess.finalAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Verification Signature:</span>
                <span className="font-mono text-emerald-400">HMAC-SHA256 Validated</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20"
              >
                Return to Merchant Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Checkout Details & Items */
          <div className="space-y-6">
            {/* Customer Greeting with Applied Offer */}
            {cartData?.discountPercent > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      WhatsApp Special {cartData.discountPercent}% OFF Applied!
                    </div>
                    <div className="text-[11px] text-slate-300">
                      You are saving ₹{Number(cartData.discountAmount).toLocaleString('en-IN')} on this order.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Items in Your Cart ({cartData?.items?.length || 0})
              </h3>
              <div className="divide-y divide-slate-800/60">
                {cartData?.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                        />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      ₹{Number(item.total_price || item.unit_price).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-slate-200">₹{Number(cartData?.originalTotal).toLocaleString('en-IN')}</span>
                </div>
                {cartData?.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>AI WhatsApp Recovery Discount ({cartData.discountPercent}%):</span>
                    <span>-₹{Number(cartData.discountAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800/60">
                  <span>Total Payable:</span>
                  <span className="text-emerald-400">₹{Number(cartData?.finalTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <span className="text-[11px] block text-slate-500">Delivering to:</span>
                <span className="font-semibold text-slate-200">{cartData?.customerName}</span> ({cartData?.customerPhone})
              </div>
              <span className="text-emerald-400 font-medium">WhatsApp Verified</span>
            </div>

            {/* Customer AI Assistance / Chatbot Trigger Card */}
            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-indigo-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Need Help with Payment or Order?</span>
                    <span className="text-[11px] text-slate-400">Our AI Shopping Assistant is available 24/7</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowInquiryModal(true)}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Send a message or inquiry directly to the store owner"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Owner</span>
                  </button>
                  <button
                    onClick={() => openChatbot()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat with AI</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Quick Issue Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => openChatbot('How do I pay with UPI or Cards?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-900/50 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                >
                  💳 How to pay via UPI / Cards?
                </button>
                <button
                  onClick={() => openChatbot('Is my recovery discount applied to this order?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-900/50 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                >
                  💰 Check discount details
                </button>
                <button
                  onClick={() => openChatbot('When will my order be delivered?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-900/50 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                >
                  📦 Delivery timeline
                </button>
                <button
                  onClick={() => openChatbot('What is your cancellation and return policy?')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-blue-900/50 border border-slate-800 hover:border-blue-500/40 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                >
                  🔄 Return & refund policy
                </button>
              </div>
            </div>

            {/* Payment Trigger Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleRazorpayPayment('success')}
                disabled={paying}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {paying ? 'Processing Razorpay Test Mode...' : `Pay ₹${Number(cartData?.finalTotal).toLocaleString('en-IN')} with Razorpay`}
              </button>

              <button
                onClick={() => handleRazorpayPayment('failure')}
                disabled={paying}
                className="w-full py-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                Simulate Razorpay Payment Failure Scenario
              </button>
            </div>
          </div>
        )}

        {/* Contact Store Owner Modal */}
        {showInquiryModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>Email Store Owner (TrendVault)</span>
                </div>
                <button
                  onClick={() => setShowInquiryModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inquirySent ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Inquiry Delivered!</h4>
                  <p className="text-xs text-slate-300">
                    The store owner has received your question and will reply directly to <strong>{cartData?.customerEmail}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have a question about sizing, custom delivery, or payment? Send a direct email to the owner.
                  </p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="text-slate-400">Sending as: <span className="text-white font-semibold">{cartData?.customerName}</span></div>
                    <div className="text-slate-400">Reply Email: <span className="text-blue-400">{cartData?.customerEmail}</span></div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Your Question or Message:</label>
                    <textarea
                      rows={4}
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      required
                      placeholder="e.g. Can you confirm if expedited 2-day delivery to Mumbai is possible for this order?"
                      disabled={inquirySubmitting}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowInquiryModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inquirySubmitting || !inquiryMsg.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{inquirySubmitting ? 'Sending...' : 'Send Inquiry'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="text-center text-[11px] text-slate-500 pt-4">
          Protected by Razorpay Test Sandbox • Powered by RazorAgent AI Autopilot
        </div>
      </div>
    </div>
  );
}
