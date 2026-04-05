import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, CreditCard, ArrowLeftRight, FileText, BadgeDollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    customers: 0, accounts: 0, transactions: 0,
    pendingLoans: 0, totalDeposits: 0, totalWithdrawals: 0, frozenAccounts: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      let allowedAccountIds: string[] = [];
      if (user?.role === 'manager' && user.branch_id) {
        const accRes = await supabase.from('account').select('account_id').eq('branch_id', user.branch_id);
        allowedAccountIds = (accRes.data || []).map(a => a.account_id);
      }

      let accQuery = supabase.from('account').select('*', { count: 'exact', head: true });
      if (user?.role === 'manager' && user.branch_id) accQuery = accQuery.eq('branch_id', user.branch_id);

      let frozenQuery = supabase.from('account').select('*', { count: 'exact', head: true }).eq('status', 'Frozen');
      if (user?.role === 'manager' && user.branch_id) frozenQuery = frozenQuery.eq('branch_id', user.branch_id);

      let txQuery = supabase.from('transaction').select('*', { count: 'exact', head: true });
      if (user?.role === 'manager' && user.branch_id) {
         if (allowedAccountIds.length > 0) {
           txQuery = txQuery.or(`from_account_id.in.(${allowedAccountIds.join(',')}),to_account_id.in.(${allowedAccountIds.join(',')})`);
         } else {
           txQuery = txQuery.eq('transaction_id', '00000000-0000-0000-0000-000000000000');
         }
      }

      const [custRes, accRes, txRes, loanRes, frozenRes] = await Promise.all([
        supabase.from('customer').select('*', { count: 'exact', head: true }),
        accQuery,
        txQuery,
        supabase.from('loan').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        frozenQuery,
      ]);

      let depQuery = supabase.from('transaction').select('amount').eq('type', 'Deposit').eq('status', 'Completed');
      let withQuery = supabase.from('transaction').select('amount').eq('type', 'Withdrawal').eq('status', 'Completed');

      if (user?.role === 'manager' && user.branch_id) {
        if (allowedAccountIds.length > 0) {
          depQuery = depQuery.in('to_account_id', allowedAccountIds);
          withQuery = withQuery.in('from_account_id', allowedAccountIds);
        } else {
          depQuery = depQuery.eq('transaction_id', 'none');
          withQuery = withQuery.eq('transaction_id', 'none');
        }
      }

      const [{ data: deposits }, { data: withdrawals }] = await Promise.all([ depQuery, withQuery ]);

      const totalDep = (deposits || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalWith = (withdrawals || []).reduce((s, t) => s + Number(t.amount), 0);

      setStats({
        customers: custRes.count || 0,
        accounts: accRes.count || 0,
        transactions: txRes.count || 0,
        pendingLoans: loanRes.count || 0,
        totalDeposits: totalDep,
        totalWithdrawals: totalWith,
        frozenAccounts: frozenRes.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const cards = [
    { label: 'Total Customers', value: stats.customers, icon: Users, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
    { label: 'Total Accounts', value: stats.accounts, icon: CreditCard, color: 'text-primary', bg: 'bg-elevated' },
    { label: 'Total Transactions', value: stats.transactions, icon: ArrowLeftRight, color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
    { label: 'Pending Loans', value: stats.pendingLoans, icon: FileText, color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
    { label: 'Total Deposits', value: `₹${fmt(stats.totalDeposits)}`, icon: TrendingUp, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
    { label: 'Total Withdrawals', value: `₹${fmt(stats.totalWithdrawals)}`, icon: BadgeDollarSign, color: 'text-secondary', bg: 'bg-app' },
    { label: 'Frozen Accounts', value: stats.frozenAccounts, icon: AlertTriangle, color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-64 bg-card rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-32 bg-card rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">System Overview</h1>
        <p className="text-sm text-secondary mt-1">High-level metrics of all banking operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, _i) => (
          <div key={card.label} className="bg-card rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 ${card.bg} -translate-y-1/2 translate-x-1/2`} />
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>

            <div className="text-[13px] text-secondary font-medium tracking-wide uppercase mb-1">{card.label}</div>
            <div className="text-2xl font-semibold text-primary font-mono tracking-wide">{card.value}</div>
          </div>
        ))}

        {/* Info Card */}
        <div className="bg-primary text-white rounded-[32px] p-6 shadow-md flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5" />
          <h3 className="text-lg font-medium mb-2 relative z-10">Management Panel</h3>
          <p className="text-sm text-white/70 relative z-10 leading-relaxed">
            Use the sidebar to manage customers, accounts, loans, and audit logs.
          </p>
        </div>
      </div>
    </div>
  );
}
