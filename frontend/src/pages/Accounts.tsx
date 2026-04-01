import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, PlusCircle, CheckCircle2, Landmark, Sparkles, Repeat, ShieldCheck, Printer } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const limitFormatter = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const accountOptions = [
  { type: 'Savings', icon: Landmark, color: 'text-accent-teal', bgClass: 'hover:bg-accent-teal/5 border-accent-teal', indicatorClass: 'bg-accent-teal', description: 'Ideal for personal savings.', features: ['No minimum balance', '₹5,000 credit', '4.5% annual interest'] },
  { type: 'Current', icon: Sparkles, color: 'text-secondary', bgClass: 'hover:bg-[#877685]/5 border-secondary', indicatorClass: 'bg-secondary', description: 'Perfect for business.', features: ['Higher daily limits', '₹5,000 credit', 'Overdraft facility'] }
];

export default function Accounts() {
  const { user } = useAuth();
  const customerId = user?.id;
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, statement, recurring, new

  const [statementData, setStatementData] = useState<any[]>([]);
  const [selectedStatementAccount, setSelectedStatementAccount] = useState('');

  // New Account State
  const [accountType, setAccountType] = useState('');
  const [creationLoading, setCreationLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    loadAccounts();
  }, [customerId]);

  const loadAccounts = async () => {
    setLoading(true);
    if (!customerId) return;
    const { data } = await supabase.from('account').select('*').eq('customer_id', customerId);
    if (data) {
      setAccounts(data);
      if (data.length > 0) setSelectedStatementAccount(data[0].account_id);
    }
    setLoading(false);
  };

  const loadStatement = async () => {
    if (!selectedStatementAccount) return;
    const { data } = await supabase
      .from('transaction')
      .select('*, from_account:from_account_id(account_number), to_account:to_account_id(account_number), beneficiary:beneficiary_id(payee_name)')
      .or(`from_account_id.eq.${selectedStatementAccount},to_account_id.eq.${selectedStatementAccount}`)
      .order('timestamp', { ascending: false })
      .limit(10);
    if (data) setStatementData(data);
  };

  useEffect(() => {
    if (activeTab === 'statement') loadStatement();
  }, [selectedStatementAccount, activeTab]);

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) return;
    setCreationLoading(true);
    setMsg({ text: '', type: '' });

    const generatedAccNo = 'AC' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    try {
      const { error } = await supabase.from('account').insert([{
        customer_id: customerId,
        account_type: accountType,
        account_number: generatedAccNo,
        balance: 5000.00,
        status: 'Active',
      }]);

      if (error) throw error;

      setMsg({ text: `✓ ${accountType} Account created: #${generatedAccNo}. ₹5,000 credited!`, type: 'success' });
      setAccountType('');
      loadAccounts();
      setTimeout(() => setActiveTab('overview'), 2000);
    } catch (err: any) {
      setMsg({ text: err.message, type: 'danger' });
    } finally {
      setCreationLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-secondary">Loading accounts...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Print-only CSS embedded */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px;}
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">My Accounts</h1>
          <p className="text-sm text-secondary mt-1">Manage accounts, statements, and instructions.</p>
        </div>
        <button 
          onClick={() => setActiveTab('new')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-primary text-white hover:bg-[#362e34] transition-all shadow-sm active:scale-95"
        >
          <PlusCircle size={18} /> Open New Account
        </button>
      </div>

      <div className="flex gap-4 border-b border-app mb-8 no-print">
        {['overview', 'statement', 'recurring'].map(tab => (
          <button
            key={tab}
            className={`pb-4 px-2 text-sm font-medium capitalize tracking-wide transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-secondary hover:text-primary'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace('recurring', 'Standing Instructions')}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.account_id} className="bg-gradient-to-br from-[#4a3f48] to-[#2c252b] text-white rounded-[24px] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="opacity-80 text-sm mb-1">{acc.account_type} Account</p>
                  <p className="font-mono tracking-widest text-lg">{acc.account_number}</p>
                </div>
                <CreditCard size={24} className="opacity-80" />
              </div>
              <div className="space-y-1 mb-4">
                <p className="opacity-60 text-xs uppercase tracking-wider">Available Balance</p>
                <p className="text-2xl font-light">₹{currencyFormatter.format(acc.balance)}</p>
              </div>
              <div className="flex justify-between items-center text-xs opacity-70">
                <span>Limit: ₹{limitFormatter.format(acc.daily_transaction_limit)}</span>
                <span className={`px-2 py-0.5 rounded-full ${acc.status === 'Active' ? 'bg-accent-teal/20 text-accent-teal' : 'bg-red-500/20 text-red-300'}`}>{acc.status}</span>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <div className="col-span-full text-center py-12 text-secondary bg-card rounded-[30px]">
              No accounts found. Open a new account to begin!
            </div>
          )}
        </div>
      )}

      {/* STATEMENTS TAB */}
      {activeTab === 'statement' && (
        <div className="bg-card rounded-[30px] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8 no-print">
            <select
              className="bg-app text-primary rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 min-w-[250px]"
              value={selectedStatementAccount}
              onChange={e => setSelectedStatementAccount(e.target.value)}
            >
              {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_type} - {a.account_number}</option>)}
            </select>
            <button onClick={handlePrint} className="inline-flex items-center justify-center gap-2 bg-secondary text-white rounded-full px-6 py-3 font-medium text-sm hover:bg-[#6c5e6a] transition-all">
              <Printer size={18} /> Download PDF (Print)
            </button>
          </div>

          <div id="print-area" className="bg-white p-6 rounded-2xl print:shadow-none print:w-full print:block">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 uppercase tracking-wide">Smartbank Mini-Statement</h2>
              <p className="text-gray-500 text-sm mt-1">Generated on: {new Date().toLocaleString()}</p>
              <p className="text-gray-700 font-medium mt-4">Account: {accounts.find(a => a.account_id === selectedStatementAccount)?.account_number || 'N/A'}</p>
            </div>
            
            <table className="w-full text-left text-sm text-gray-700">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Ref ID</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-right">Debit</th>
                  <th className="pb-3 font-semibold text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statementData.map(tx => {
                  const isDebit = tx.from_account_id === selectedStatementAccount;
                  return (
                    <tr key={tx.transaction_id}>
                      <td className="py-4">{new Date(tx.timestamp).toLocaleDateString()}</td>
                      <td className="py-4 font-mono text-xs">{tx.transaction_ref}</td>
                      <td className="py-4">{tx.type} {tx.type === 'Transfer' ? (isDebit ? `to ${tx.to_account?.account_number || tx.beneficiary?.payee_name}` : `from ${tx.from_account?.account_number}`) : ''}</td>
                      <td className="py-4 text-right">{isDebit ? `₹${tx.amount.toFixed(2)}` : '-'}</td>
                      <td className="py-4 text-right">{!isDebit ? `₹${tx.amount.toFixed(2)}` : '-'}</td>
                    </tr>
                  )
                })}
                {statementData.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">No transactions recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STANDING INSTRUCTIONS TAB */}
      {activeTab === 'recurring' && (
        <div className="bg-card rounded-[30px] p-8 shadow-sm text-center">
          <Repeat size={48} className="mx-auto text-secondary mb-4 opacity-50" />
          <h2 className="text-xl font-medium text-primary mb-2">Standing Instructions</h2>
          <p className="text-sm text-secondary max-w-md mx-auto mb-6">Automate your recurring transfers by setting up standing instructions on your account. Specify weekly or monthly schedules.</p>
          <div className="inline-flex flex-col items-center bg-app/50 p-6 rounded-2xl">
            <p className="text-accent-gold font-medium text-sm mb-2">Notice</p>
            <p className="text-sm text-primary">This feature requires configuration through the branch office. Please contact support or visit your home branch to set up automatic deduction mandates.</p>
          </div>
        </div>
      )}

      {/* OPEN NEW ACCOUNT TAB UI */}
      {activeTab === 'new' && (
        <div className="bg-card rounded-[40px] p-8 md:p-12 shadow-sm transition-all duration-300">
          {msg.text && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${msg.type === 'success' ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20' : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20'}`}>
              {msg.type === 'success' ? <CheckCircle2 size={20} /> : <CreditCard size={20} />}
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {accountOptions.map(opt => {
              const isSelected = accountType === opt.type;
              return (
                <div key={opt.type} onClick={() => setAccountType(opt.type)} className={`p-6 rounded-[24px] cursor-pointer border-2 transition-all duration-300 relative overflow-hidden group ${isSelected ? `bg-elevated ${opt.bgClass} shadow-md border-opacity-100 scale-[1.02]` : 'bg-app border-transparent hover:border-black/5'}`}>
                  {isSelected && <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-30 ${opt.indicatorClass} -translate-y-1/2 translate-x-1/2`} />}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-shell ${opt.color}`}><opt.icon size={28} /></div>
                  <h3 className="text-xl font-semibold text-primary mb-2">{opt.type} Account</h3>
                  <p className="text-sm text-secondary mb-6 leading-relaxed">{opt.description}</p>
                  <div className="flex flex-col gap-3">
                    {opt.features.map(f => <div key={f} className="flex items-center gap-2 text-sm text-secondary"><CheckCircle2 size={16} className={opt.color} />{f}</div>)}
                  </div>
                  {isSelected && <div className="absolute top-6 right-6"><div className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-xs font-semibold uppercase tracking-wider">Selected</div></div>}
                </div>
              );
            })}
          </div>

          <div className="bg-app rounded-[24px] p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2 bg-secondary/10 rounded-full text-secondary shrink-0"><ShieldCheck size={20} /></div>
              <p className="text-sm text-secondary leading-relaxed">
                <strong className="text-primary font-medium">Agreement:</strong> By selecting "Open Account", you agree to our banking terms. ₹5,000 will be credited.
              </p>
            </div>
            <button onClick={handleOpenAccount as any} disabled={creationLoading || !accountType} className="w-full bg-secondary text-white rounded-full py-4 font-medium text-[16px] hover:bg-[#6c5e6a] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
              {creationLoading ? 'Processing...' : <><PlusCircle size={20} />{accountType ? `Open ${accountType} Account` : 'Select an Account Type'}</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
