import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShoppingBag,
  PlusCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Tag,
  DollarSign,
  Package,
  ArrowRight,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // New product form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1999);
  const [inventory, setInventory] = useState(50);
  const [category, setCategory] = useState('Electronics');
  const [imageUrl, setImageUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    try {
      setCreating(true);
      await fetch('/api/catalog/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('razoragent_token') || ''}`
        },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          inventoryCount: Number(inventory),
          category,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
        })
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      await loadProducts();
      alert('Product created successfully in store catalog!');
    } catch (err) {
      alert(err.message || 'Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  const formatINR = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
              Core Feature 5
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              Catalog Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            Products & Inventory Opportunities
          </h1>
          <p className="text-xs text-slate-400">
            Manage live catalog items, stock velocity, product gross margins, and AI cross-selling bundle recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button
            onClick={loadProducts}
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI Product Bundling Banner */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 via-slate-900/60 to-slate-950 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI Catalog Recommendation
          </span>
          <h3 className="text-sm font-bold text-white">
            High Margin Bundle: Wireless Headphones Pro + Dual Desk Mat
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Shoppers who view active noise-cancelling headphones show 42% basket affinity for desk accessories.
            Activating a 10% checkout bundle lifts Average Order Value by ₹899.
          </p>
        </div>

        <Link
          to="/action-center"
          className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Authorize in Action Center</span>
        </Link>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg group"
          >
            <div>
              <div className="h-48 w-full bg-slate-950 relative overflow-hidden">
                <img
                  src={prod.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800">
                  {prod.category || 'General'}
                </span>
                <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-950/80 backdrop-blur-md text-emerald-400 border border-emerald-800">
                  {formatINR(prod.price)}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h4 className="text-sm font-bold text-white line-clamp-1">{prod.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {prod.description}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Stock: <strong className="text-white">{prod.inventory_count ?? 50} units</strong></span>
                  <span className="text-emerald-400 font-semibold">Active in WhatsApp Agent</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0">
              <Link
                to="/whatsapp-agent"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>Test in WhatsApp Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add New Store Product</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Smart Bluetooth Speaker"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short product highlights..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Inventory Units</label>
                  <input
                    type="number"
                    value={inventory}
                    onChange={(e) => setInventory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Wearables">Wearables</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Image URL (Unsplash or CDN)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/40"
              >
                {creating ? 'Saving...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
