import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronRight, ArrowDownRight, ArrowUpRight, CreditCard, User, Landmark, Plus, Calendar } from 'lucide-react';
import { formatDate } from '../lib/utils';

const fmt = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function Dashboard() {
  const { user } = useAuth();
  const customerId = user?.id;
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [emis, setEmis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: custData } = await supabase.from('customer').select('name').eq('customer_id', customerId).single();
        if (custData) setCustomerName(custData.name);

        const { data: accData } = await supabase.from('account').select('*').eq('customer_id', customerId);
        if (accData) setAccounts(accData);

        const { data: benData } = await supabase.from('beneficiary').select('*').eq('customer_id', customerId).limit(3);
        if (benData) setBeneficiaries(benData);

        if (accData && accData.length > 0) {
          const accountIds = accData.map(a => a.account_id);
          const { data: txData } = await supabase
            .from('transaction').select('*, from_account:from_account_id(account_number), to_account:to_account_id(account_number), beneficiary:beneficiary_id(payee_name)')
            .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`)
            .order('timestamp', { ascending: false }).limit(4);
          if (txData) setTransactions(txData);
        }

        const { data: loanData } = await supabase.from('loan').select('loan_id, loan_type').eq('customer_id', customerId);
        if (loanData && loanData.length > 0) {
          const loanIds = loanData.map(l => l.loan_id);
          const { data: emiData } = await supabase.from('repayment_schedule')
             .select('*, loan:loan_id(loan_type)')
             .in('loan_id', loanIds)
             .in('pay_status', ['Unpaid', 'Pending'])
             .order('due_date', { ascending: true })
             .limit(2);
          if (emiData) setEmis(emiData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    if (customerId) loadDashboard();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-64 bg-card rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-6"><div className="h-64 flex-1 bg-card rounded-[30px]" /><div className="h-64 flex-1 bg-card rounded-[30px]" /></div>
            <div className="h-48 bg-card rounded-[30px]" />
          </div>
          <div className="space-y-4"><div className="h-32 bg-secondary/20 rounded-[24px]" /><div className="h-32 bg-secondary/20 rounded-[24px]" /></div>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);
  const highestLimit = accounts.length > 0 ? Math.max(...accounts.map(a => Number(a.daily_transaction_limit))) : 0;

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Hello, {customerName.split(' ')[0] || 'User'}!</h1>
        <p className="text-sm text-secondary mt-1">Here is your dynamic financial overview.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left/Center Column */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick Transfers */}
            <div className="bg-card rounded-[30px] p-6 flex flex-col h-full">
              <h2 className="text-lg font-medium text-secondary mb-4">Quick Transfers</h2>
              <div className="flex flex-col gap-3 flex-1">
                {beneficiaries.length > 0 ? beneficiaries.map(b => (
                  <div key={b.beneficiary_id} className="flex items-center justify-between rounded-full p-2 pr-4 bg-app/50 transition-colors hover:bg-app">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-shell flex items-center justify-center text-primary font-medium">
                        {b.payee_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-primary">{b.payee_name}</p>
                        <p className="text-[12px] text-secondary">{b.bank_name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/transfer')}
                      className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center hover:bg-[#6c5e6a] transition-colors active:scale-95 shadow-sm"
                    >
                      <Send size={14} className="ml-0.5" />
                    </button>
                  </div>
                )) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-secondary text-sm">
                    <User size={32} className="mb-2 opacity-50" />
                    <p>No beneficiaries saved</p>
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/beneficiaries')} className="text-sm text-secondary font-medium flex items-center gap-1 mt-4 hover:text-primary transition-colors w-fit">
                Manage Payees <ChevronRight size={16} />
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-[30px] p-6 flex flex-col h-full">
              <h2 className="text-lg font-medium text-secondary mb-4">Recent Activity</h2>
              <div className="flex flex-col gap-4 flex-1">
                {transactions.slice(0, 3).map(tx => {
                  const isDebit = tx.from_account_id && accounts.some(a => a.account_id === tx.from_account_id);
                  return (
                    <div key={tx.transaction_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDebit ? 'bg-accent-rose/20 text-accent-rose' : 'bg-accent-teal/20 text-accent-teal'}`}>
                          {isDebit ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-primary">
                            {tx.type === 'Transfer' ? (isDebit ? `To ${tx.to_account?.account_number || tx.beneficiary?.payee_name || 'Account'}` : `From ${tx.from_account?.account_number || 'Account'}`) : tx.type}
                          </p>
                          <p className="text-[12px] text-secondary">
                            {formatDate(tx.timestamp)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[14px] font-medium ${isDebit ? 'text-primary' : 'text-accent-teal'}`}>
                        {isDebit ? '-' : '+'}₹{fmt.format(tx.amount)}
                      </span>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-secondary text-sm">
                    <p>No recent transactions</p>
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/accounts')} className="text-sm text-secondary font-medium flex items-center gap-1 mt-4 hover:text-primary transition-colors w-fit">
                View Statements <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Row 2: EMI Schedule */}
          <div className="bg-card rounded-[30px] p-6">
            <h2 className="text-lg font-medium text-secondary mb-4">Upcoming EMIs</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-app rounded-[24px] p-5 w-full md:w-[220px] shrink-0 flex flex-col items-center justify-center text-center">
                 <Calendar size={32} className="text-secondary mb-2 opacity-50" />
                 <h3 className="font-medium text-primary mb-1">Stay Scheduled</h3>
                 <p className="text-[12px] text-secondary">Timely repayments improve your credit score limits.</p>
              </div>
              
              <div className="flex-1 flex flex-col justify-center gap-3">
                {emis.length > 0 ? emis.map((emi, idx) => {
                  const day = new Date(emi.due_date).getDate();
                  return (
                    <div key={emi.schedule_id} className={`flex items-center gap-4 bg-app/50 rounded-full px-5 py-3 ${idx > 0 && 'opacity-60'}`}>
                      <span className="text-2xl font-light text-primary w-8">{day.toString().padStart(2, '0')}</span>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium text-primary">{(emi.loan as any)?.loan_type} Loan Installment</p>
                        <p className="text-[11px] text-secondary">Due: {formatDate(emi.due_date)}</p>
                      </div>
                      <span className="text-[15px] font-medium text-primary">₹{fmt.format(emi.emi_amount)}</span>
                    </div>
                  )
                }) : (
                   <div className="flex items-center gap-4 bg-app/50 rounded-full px-5 py-4">
                     <p className="text-[14px] font-medium text-secondary text-center w-full">No active EMI schedules found.</p>
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Active Accounts (replaces fake cards) */}
          <div>
            <h2 className="text-lg font-medium text-secondary mb-4">Active Accounts Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.slice(0, 2).map((acc, idx) => (
                <div key={acc.account_id} className={`text-white rounded-[20px] p-6 shadow-xl hover:-translate-y-1 transition-transform cursor-pointer relative overflow-hidden ${idx === 0 ? 'bg-gradient-to-br from-[#4a3f48] to-[#2c252b]' : 'bg-gradient-to-br from-[#df7b89] to-[#c76573]'}`} onClick={() => navigate('/accounts')}>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl ${idx === 0 ? 'bg-white/5' : 'bg-white/10'}`} />
                  <div className="flex justify-between items-start mb-8">
                    <Landmark size={24} className="opacity-80" />
                    <span className="text-[12px] font-medium tracking-wider uppercase">{acc.account_type}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] opacity-80">Avail. Balance</p>
                    <p className="font-mono tracking-widest text-xl">₹{fmt.format(acc.balance)}</p>
                    <p className="text-[11px] opacity-60 font-mono pt-2">{acc.account_number}</p>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                 <div className="col-span-1 md:col-span-2 text-center py-6 text-sm text-secondary bg-card rounded-[20px]">
                   No active accounts found.
                 </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Metrics Panel */}
        <div className="w-full lg:w-[260px] shrink-0 flex flex-col gap-4">
          <h2 className="text-lg font-medium text-secondary mb-2">Metrics Snapshot</h2>
          
          <div className="bg-secondary rounded-[24px] p-5 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90 absolute inset-0">
                <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" strokeOpacity="0.15" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#df7b89" strokeWidth="8" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * 0.1} strokeLinecap="round" fill="transparent" />
              </svg>
              <Landmark size={20} className="text-white z-10" />
            </div>
            <div className="flex flex-col text-white">
              <span className="text-[13px] font-medium opacity-90">Total Liquidity</span>
              <span className="text-[12px] font-medium mt-0.5">₹{fmt.format(totalBalance)}</span>
            </div>
          </div>

          <div className="bg-secondary rounded-[24px] p-5 flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-16 h-16 -rotate-90 absolute inset-0">
                <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="8" strokeOpacity="0.15" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#6eb3b0" strokeWidth="8" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * 0.25} strokeLinecap="round" fill="transparent" />
              </svg>
              <CreditCard size={20} className="text-white z-10" />
            </div>
            <div className="flex flex-col text-white">
              <span className="text-[13px] font-medium opacity-90">Highest Limit</span>
              <span className="text-[12px] font-medium mt-0.5">₹{fmt.format(highestLimit)}</span>
            </div>
          </div>

          <button onClick={() => navigate('/accounts')} className="text-sm text-secondary font-medium flex items-center justify-center gap-1 mt-2 hover:text-primary transition-colors py-2">
            See all accounts <ChevronRight size={16} />
          </button>

          <div className="mt-auto pt-6">
            <button 
              onClick={() => navigate('/accounts')} 
              className="w-full bg-primary text-white rounded-full py-3 px-4 font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-[#362e34] transition-colors active:scale-95 shadow-lg"
            >
              <Plus size={18} /> Add New Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
