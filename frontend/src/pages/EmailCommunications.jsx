import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Mail,
  Send,
  Inbox,
  Clock,
  CheckCheck,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Reply,
  Eye,
  X,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  CheckCircle2
} from 'lucide-react';

export function EmailCommunications() {
  const [communications, setCommunications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);

  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewEmailId, setPreviewEmailId] = useState(null);

  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const [composeForm, setComposeForm] = useState({
    recipientEmail: 'aarav.sharma@example.com',
    recipientName: 'Aarav Sharma',
    subject: 'Update regarding your TrendVault order',
    templateType: 'custom',
    bodyText: ''
  });
  const [sendingCompose, setSendingCompose] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [commsRes, statsRes] = await Promise.all([
        api.getEmailCommunications({ search: searchQuery }),
        api.getEmailStats()
      ]);
      const list = commsRes.communications || [];
      setCommunications(list);
      setStats(statsRes);
      if (list.length > 0 && !selectedEmail) {
        setSelectedEmail(list[0]);
      } else if (selectedEmail) {
        const updated = list.find(e => e.id === selectedEmail.id);
        if (updated) setSelectedEmail(updated);
      }
    } catch (err) {
      console.error('Failed to load email communications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const filteredList = communications.filter(email => {
    if (activeTab === 'inbound') return email.direction === 'inbound';
    if (activeTab === 'outbound') return email.direction === 'outbound' && email.template_type !== 'order_confirmation';
    if (activeTab === 'receipts') return email.template_type === 'order_confirmation';
    return true;
  });

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;

    try {
      setReplying(true);
      await api.sendEmailReply({
        emailId: selectedEmail.id,
        replyMessage: replyText,
        customerEmail: selectedEmail.sender_email,
        customerName: selectedEmail.sender_name || 'Valued Customer',
        originalSubject: selectedEmail.subject
      });
      setReplyText('');
      setReplySuccess(true);
      setTimeout(() => setReplySuccess(false), 3000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleSendCompose = async (e) => {
    e.preventDefault();
    if (!composeForm.recipientEmail || !composeForm.subject || !composeForm.bodyText) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      setSendingCompose(true);
      await api.sendEmail({
        recipientEmail: composeForm.recipientEmail,
        recipientName: composeForm.recipientName,
        subject: composeForm.subject,
        bodyText: composeForm.bodyText,
        templateType: composeForm.templateType
      });
      setShowComposeModal(false);
      setComposeForm({
        recipientEmail: 'aarav.sharma@example.com',
        recipientName: 'Aarav Sharma',
        subject: '',
        templateType: 'custom',
        bodyText: ''
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to send email');
    } finally {
      setSendingCompose(false);
    }
  };

  const handleTemplateSelect = (tpl) => {
    if (tpl === 'cart_recovery') {
      setComposeForm(prev => ({
        ...prev,
        templateType: 'cart_recovery',
        subject: 'Reserved: Complete your TrendVault order with 10% off!',
        bodyText: 'Hi Aarav,\n\nWe noticed you left some luxury items in your shopping bag. We have applied an exclusive 10% discount code just for you.\n\nClick here to complete your order: http://localhost:5173/checkout/demo_token_aarav'
      }));
    } else if (tpl === 'vip_perk') {
      setComposeForm(prev => ({
        ...prev,
        templateType: 'custom',
        subject: 'VIP Member Benefit: Early Access to Royal Heritage Drop',
        bodyText: 'Hi Aarav,\n\nAs one of our highest-tier VIP patrons, you have been granted private access to our upcoming Royal Silk Bandhgala Collection before public launch.\n\nEnjoy complimentary expedited shipping on your next purchase.'
      }));
    } else {
      setComposeForm(prev => ({
        ...prev,
        templateType: 'custom',
        subject: 'Update from TrendVault Store Owner',
        bodyText: ''
      }));
    }
  };

  const getTemplateBadge = (tpl, direction) => {
    if (direction === 'inbound') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
          <Inbox className="w-3 h-3" /> Client Inquiry
        </span>
      );
    }
    if (tpl === 'cart_recovery') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Cart Recovery
        </span>
      );
    }
    if (tpl === 'order_confirmation') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
          <ShoppingBag className="w-3 h-3" /> Order Receipt
        </span>
      );
    }
    if (tpl === 'merchant_reply') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
          <Reply className="w-3 h-3" /> Store Reply
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
        Direct Email
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Email Communications Hub
            </h1>
            <p className="text-xs text-slate-400">
              Bidirectional communication between clients and store owners, checkout inquiries, and automated transactional emails.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose Email</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Communications</div>
          <div className="text-2xl font-black text-white mt-1">{stats?.totalEmails || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all client channels</div>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
          <div className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider">Client Inquiries</div>
          <div className="text-2xl font-black text-purple-200 mt-1">{stats?.inboundInquiries || 0}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Submitted via checkout portal</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">Cart Recoveries Sent</div>
          <div className="text-2xl font-black text-emerald-200 mt-1">{stats?.recoveryEmails || 0}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">With personalized discounts</div>
        </div>
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4">
          <div className="text-[11px] text-blue-300 font-semibold uppercase tracking-wider">Delivery & Open Rate</div>
          <div className="text-2xl font-black text-blue-200 mt-1">100% / {stats?.openRate || 68.4}%</div>
          <div className="text-[10px] text-blue-400/80 mt-0.5">Zero bounce rate</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white')}
          >
            All Messages ({communications.length})
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (activeTab === 'inbound' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white')}
          >
            Client Inquiries ({communications.filter(c => c.direction === 'inbound').length})
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (activeTab === 'outbound' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white')}
          >
            Outbox & Recovery ({communications.filter(c => c.direction === 'outbound' && c.template_type !== 'order_confirmation').length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (activeTab === 'receipts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white')}
          >
            Order Receipts ({communications.filter(c => c.template_type === 'order_confirmation').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email threads..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Split-View Hub: List on Left, Detail & Reply on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Column: Email Thread List */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Conversations ({filteredList.length})</span>
            <span className="text-[11px] text-slate-500">Sorted by newest</span>
          </div>

          <div className="divide-y divide-slate-900 overflow-y-auto flex-1 max-h-[540px]">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No emails found for this filter.
              </div>
            ) : (
              filteredList.map((eml) => {
                const isSelected = selectedEmail?.id === eml.id;
                const isClientInquiry = eml.direction === 'inbound';
                const displayName = isClientInquiry ? eml.sender_name : eml.recipient_name;
                const displayEmail = isClientInquiry ? eml.sender_email : eml.recipient_email;

                return (
                  <div
                    key={eml.id}
                    onClick={() => setSelectedEmail(eml)}
                    className={'p-4 cursor-pointer transition-all ' + (isSelected ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : 'hover:bg-slate-900/50')}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {displayName?.charAt(0) || 'C'}
                        </div>
                        <span className="text-xs font-bold text-white truncate max-w-[150px]">
                          {displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTemplateBadge(eml.template_type, eml.direction)}
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1">
                      {eml.subject}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {eml.body_text}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900/80 text-[10px] text-slate-500">
                      <span>{displayEmail}</span>
                      <span>{new Date(eml.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Email Detail & Action Pane */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col">
          {selectedEmail ? (
            <div className="flex flex-col h-full">
              {/* Email Reading Header */}
              <div className="p-6 border-b border-slate-800/80 bg-slate-900/30">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    {getTemplateBadge(selectedEmail.template_type, selectedEmail.direction)}
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Delivered
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPreviewEmailId(selectedEmail.id);
                        setShowPreviewModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Preview HTML Email</span>
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white mb-3">
                  {selectedEmail.subject}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">From:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedEmail.sender_name} ({selectedEmail.sender_email})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">To:</span>
                    <span className="text-slate-200 font-medium">
                      {selectedEmail.recipient_name} ({selectedEmail.recipient_email})
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {selectedEmail.body_text}
                </div>

                {selectedEmail.metadata && (
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Associated Context:</div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      {JSON.stringify(typeof selectedEmail.metadata === 'string' ? JSON.parse(selectedEmail.metadata) : selectedEmail.metadata, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Reply Section */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
                {replySuccess && (
                  <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Reply sent directly to {selectedEmail.sender_email}!</span>
                  </div>
                )}

                <form onSubmit={handleSendReply} className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-blue-400" />
                      Reply directly to {selectedEmail.direction === 'inbound' ? selectedEmail.sender_name : selectedEmail.recipient_name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Sent via TrendVault SMTP Support
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the client..."
                    disabled={replying}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{replying ? 'Sending Reply...' : 'Send Reply to Client'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              <Mail className="w-12 h-12 text-slate-700 mb-3" />
              <p>Select an email thread from the left to view details and reply.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Compose Email to Client</span>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Templates Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Apply Starter Template:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('cart_recovery')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium transition-all"
                >
                  ⚡ Cart Recovery (10% Off)
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('vip_perk')}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-[11px] text-purple-300 font-medium transition-all"
                >
                  👑 VIP Loyalty Perk
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('custom')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 font-medium transition-all"
                >
                  📝 Blank / Custom
                </button>
              </div>
            </div>

            <form onSubmit={handleSendCompose} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Select Customer:</label>
                <select
                  value={composeForm.recipientEmail}
                  onChange={(e) => {
                    const email = e.target.value;
                    let name = 'Valued Customer';
                    if (email.includes('aarav')) name = 'Aarav Sharma';
                    if (email.includes('priya')) name = 'Priya Patel';
                    if (email.includes('rohan')) name = 'Rohan Mehta';
                    setComposeForm(prev => ({ ...prev, recipientEmail: email, recipientName: name }));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="aarav.sharma@example.com">Aarav Sharma (aarav.sharma@example.com)</option>
                  <option value="priya.patel@example.com">Priya Patel (priya.patel@example.com)</option>
                  <option value="rohan.mehta@example.com">Rohan Mehta (rohan.mehta@example.com)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Subject:</label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  placeholder="e.g. Exclusive offer regarding your saved cart"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Message Body:</label>
                <textarea
                  rows={6}
                  value={composeForm.bodyText}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, bodyText: e.target.value }))}
                  required
                  placeholder="Type the message to the client..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingCompose}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingCompose ? 'Sending...' : 'Send Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML Live Email Preview Modal */}
      {showPreviewModal && previewEmailId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Responsive HTML Email Client Preview (Gmail / Apple Mail View)</span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-white">
              <iframe
                title="Email Preview"
                src={api.getEmailPreviewUrl(previewEmailId)}
                className="w-full h-full border-0"
              />
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Rendering live HTML markup from database storage</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
