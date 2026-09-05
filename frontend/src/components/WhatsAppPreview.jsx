import React from 'react';
import { MessageSquare, ExternalLink, CheckCheck } from 'lucide-react';

export function WhatsAppPreview({ customerName = 'Aarav Sharma', merchantName = 'TrendVault India', cartValue = 4298, discountPercent = 10, discountAmount = 430, checkoutUrl = 'http://localhost:5173/checkout/recov_tok_aarav_4298' }) {
  return (
    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-[#0b141a] p-4 shadow-2xl">
      {/* WhatsApp Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div className="w-10 h-10 rounded-full bg-whatsapp-teal flex items-center justify-center text-white font-bold text-base shadow-sm">
          {merchantName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-100">{merchantName}</h4>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
          </div>
          <p className="text-[11px] text-slate-400">Official Business Account</p>
        </div>
      </div>

      {/* Message Body Bubble */}
      <div className="mt-4 flex flex-col items-start">
        <div className="relative rounded-2xl rounded-tl-none bg-[#1f2c34] p-4 text-xs text-slate-200 shadow-md border border-slate-700/40 max-w-[92%] leading-relaxed">
          <div className="font-semibold text-emerald-400 mb-1.5 text-xs flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Cart Recovery Offer
          </div>
          <p className="mb-2">
            Hi <span className="font-semibold text-white">{customerName}</span>,
          </p>
          <p className="mb-2">
            You left items worth <span className="font-semibold text-white">₹{Number(cartValue).toLocaleString('en-IN')}</span> in your cart.
          </p>
          {discountPercent > 0 && (
            <div className="my-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              🎉 Exclusive Offer: <span className="font-bold">{discountPercent}% OFF</span> (Save ₹{Number(discountAmount).toLocaleString('en-IN')}) applied automatically at checkout!
            </div>
          )}
          <p className="mb-3">Complete your purchase safely using the Razorpay link below:</p>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/50 break-all text-blue-400 text-[11px] flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{checkoutUrl}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-700/40 pt-2">
            <span>Reply STOP to unsubscribe</span>
            <div className="flex items-center gap-1 text-cyan-400">
              <span>Just now</span>
              <CheckCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-3 text-center">
        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          Approved WhatsApp Template: cart_recovery
        </span>
      </div>
    </div>
  );
}
