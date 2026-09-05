import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, CreditCard, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export function OrdersPayments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Orders & Razorpay Settlements
            </h1>
            <p className="text-xs text-slate-400">
              Complete ledger of converted checkouts, applied recovery discounts, and Razorpay Test Mode transactions.
            </p>
          </div>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl shadow-black/20">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold">
            <tr>
              <th className="p-4">Order #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Status</th>
              <th className="p-4">Source</th>
              <th className="p-4">Original</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Settled Total</th>
              <th className="p-4">Razorpay Order ID</th>
              <th className="p-4">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-slate-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-900/50">
                  <td className="p-4 font-mono font-bold text-white">{ord.order_number}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-200">{ord.customer_name || 'Guest'}</div>
                    <div className="text-[10px] text-slate-400">{ord.customer_phone}</div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="p-4">
                    {ord.recovery_source === 'whatsapp_agent' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        ⚡ AI WhatsApp
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Direct Store</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">₹{Number(ord.total_amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 text-rose-400 font-medium">
                    {Number(ord.discount_amount) > 0 ? `-₹${Number(ord.discount_amount).toLocaleString('en-IN')}` : '₹0'}
                  </td>
                  <td className="p-4 font-bold text-white">₹{Number(ord.final_amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono text-[11px] text-blue-400">{ord.razorpay_order_id || '-'}</td>
                  <td className="p-4 text-slate-400 text-[11px]">{new Date(ord.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
