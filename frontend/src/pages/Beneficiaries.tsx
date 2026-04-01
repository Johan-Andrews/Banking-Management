import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Clock, Trash2, Users, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';

export default function Beneficiaries() {
  const { user } = useAuth();
  const customerId = user?.id;
  const [bens, setBens] = useState<any[]>([]);

  const [name, setName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bank, setBank] = useState('');
  const [limit, setLimit] = useState('10000');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  
  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  
  // Mobile slide-over state
  const [showAddForm, setShowAddForm] = useState(false);

  async function loadData() {
    const { data } = await supabase.from('beneficiary').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (data) setBens(data);
  }

  useEffect(() => { loadData(); }, [customerId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg({ text: '', type: '' });

    // IFSC validation
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
      setStatusMsg({ text: 'Invalid IFSC code format.', type: 'danger' });
      return;
    }

    const { error } = await supabase.from('beneficiary').insert([{
      customer_id: customerId,
      payee_name: name,
      account_number: accNum,
      ifsc_code: ifsc.toUpperCase(),
      bank_name: bank,
      daily_transfer_limit: parseFloat(limit) || 10000,
    }]);

    if (error) {
      setStatusMsg({ text: error.message, type: 'danger' });
    } else {
      setStatusMsg({ text: 'Beneficiary added! 24-h cooling applies.', type: 'success' });
      setName(''); setAccNum(''); setIfsc(''); setBank(''); setLimit('10000');
      loadData();
      setTimeout(() => {
        setShowAddForm(false);
        setStatusMsg({ text: '', type: '' });
      }, 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this beneficiary?')) return;
    await supabase.from('beneficiary').delete().eq('beneficiary_id', id);
    loadData();
  };

  const isCooling = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return now - created < 24 * 60 * 60 * 1000;
  };

  const cooldownRemaining = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const remaining = (created + 24 * 60 * 60 * 1000) - Date.now();
    if (remaining <= 0) return '';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto relative px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Manage Beneficiaries</h1>
          <p className="text-sm text-secondary mt-1">Saved payees for external transfers.</p>
        </div>
        <button 
          className="md:hidden bg-secondary text-white rounded-full py-3 px-6 font-medium tracking-wide flex items-center justify-center gap-2 shadow-lg"
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} /> Add Payee
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main List */}
        <div className="flex-1 bg-card rounded-[40px] p-6 md:p-10 shadow-sm min-h-[500px]">
          <h3 className="text-lg font-medium text-primary mb-6 flex items-center gap-2">
            <Users size={20} className="text-secondary" /> Saved Payees
          </h3>

          {bens.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-secondary empty-state">
              <Users size={48} className="mb-4 opacity-40" />
              <h4 className="text-lg font-medium text-primary mb-1">No Beneficiaries</h4>
              <p className="text-sm">Add your first payee to start making transfers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-app">
                    <th className="pb-4 text-xs tracking-wider uppercase font-semibold text-secondary">Payee Info</th>
                    <th className="pb-4 text-xs tracking-wider uppercase font-semibold text-secondary">Bank Details</th>
                    <th className="pb-4 text-xs tracking-wider uppercase font-semibold text-secondary">Account</th>
                    <th className="pb-4 text-xs tracking-wider uppercase font-semibold text-secondary text-right pr-4">Limit</th>
                    <th className="pb-4 text-xs tracking-wider uppercase font-semibold text-secondary">Status</th>
                    <th className="pb-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app">
                  {bens.map(b => (
                    <tr key={b.beneficiary_id} className="hover:bg-app/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-shell flex items-center justify-center text-primary font-medium text-lg">
                            {b.payee_name.charAt(0)}
                          </div>
                          <span className="font-medium text-[15px] text-primary">{b.payee_name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-[14px] text-primary">{b.bank_name}</span>
                          <span className="text-[12px] font-mono tracking-wider text-secondary">{b.ifsc_code}</span>
                        </div>
                      </td>
                      <td className="py-4 text-[14px] font-mono tracking-wide text-primary">
                        {b.account_number}
                      </td>
                      <td className="py-4 text-[14px] font-mono tracking-wide text-primary text-right pr-4">
                        ₹{fmt(b.daily_transfer_limit || 10000)}
                      </td>
                      <td className="py-4">
                        {isCooling(b.created_at) ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent-gold/10 text-accent-gold tracking-wide">
                              Cooling Period
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-secondary font-medium pl-1">
                              <Clock size={10} />
                              {cooldownRemaining(b.created_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent-teal/10 text-accent-teal tracking-wide gap-1">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-accent-rose/10 hover:text-accent-rose transition-colors"
                          onClick={() => handleDelete(b.beneficiary_id)}
                          title="Remove Beneficiary"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Form (Desktop Side Panel / Mobile Slide-over) */}
        <div className={`
          fixed lg:static inset-y-0 right-0 z-50 w-full md:w-[400px] lg:w-[380px] shrink-0 
          bg-shell lg:bg-transparent shadow-2xl lg:shadow-none p-6 md:p-8 
          transition-transform duration-300 transform 
          ${showAddForm ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="lg:bg-card lg:rounded-[40px] lg:p-8 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                <UserPlus size={20} className="text-secondary" /> Add New Payee
              </h3>
              <button className="lg:hidden text-secondary p-2" onClick={() => setShowAddForm(false)}>✕</button>
            </div>

            {statusMsg.text && (
              <div className={`mb-6 p-3 rounded-xl flex items-center gap-2 text-[13px] font-medium ${statusMsg.type === 'success' ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20' : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20'}`}>
                {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Payee Name</label>
                <input type="text" className="w-full bg-app lg:bg-app text-primary rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. Roopesh K" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Account Number</label>
                <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. 1234567890" value={accNum} onChange={e => setAccNum(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">IFSC Code</label>
                <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 uppercase" placeholder="e.g. HDFC0001234" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} required />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Bank Name</label>
                <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. HDFC Bank" value={bank} onChange={e => setBank(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Daily Transfer Limit (₹)</label>
                <input type="number" min="1" className="w-full bg-app text-primary rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. 50000" value={limit} onChange={e => setLimit(e.target.value)} required />
              </div>

              <div className="pt-4 mt-2 border-t border-app lg:border-app/30">
                <button type="submit" className="w-full bg-secondary text-white rounded-full py-3.5 font-medium text-[15px] hover:bg-[#6c5e6a] transition-colors active:scale-95 shadow-md flex items-center justify-center gap-2">
                  <UserPlus size={18} /> Save Beneficiary
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 justify-center text-accent-gold text-[12px] font-medium">
                <Clock size={14} /> 24-h cooling period will apply
              </div>
            </form>
          </div>
        </div>

        {/* Mobile slide-over backdrop */}
        {showAddForm && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
}
