import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeftRight, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../lib/utils';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);

      let allowedAccountIds: string[] = [];
      if (user?.role === 'manager' && user.branch_id) {
        const accRes = await supabase.from('account').select('account_id').eq('branch_id', user.branch_id);
        allowedAccountIds = (accRes.data || []).map(a => a.account_id);
      }

      let query = supabase.from('transaction').select('*').order('timestamp', { ascending: false }).limit(200);
      if (filterType) query = query.eq('type', filterType);

      if ((user?.role === 'manager' || user?.role === 'staff') && user.branch_id) {
        if (allowedAccountIds.length > 0) {
          query = query.or(`from_account_id.in.(${allowedAccountIds.join(',')}),to_account_id.in.(${allowedAccountIds.join(',')})`);
        } else {
          query = query.eq('transaction_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data } = await query;
      if (data) setTransactions(data);
      setLoading(false);
    }
    load();
  }, [filterType, user]);

  const handleApprove = async (txId: string, status: string) => {
    try {
      const { error } = await supabase.rpc('approve_transaction', { p_txn_id: txId, p_status: status });
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.transaction_id === txId ? { ...t, status } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const filtered = transactions.filter(tx =>
    (tx.transaction_ref || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">All Transactions</h1>
          <p className="text-sm text-secondary mt-1">Complete transaction ledger across all accounts</p>
        </div>
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary tracking-wide shadow-sm">
          {transactions.length} shown
        </span>
      </div>

      <div className="bg-card rounded-[40px] p-6 md:p-10 shadow-sm min-h-[500px]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-lg">
            <Search size={18} className="absolute top-1/2 left-5 -translate-y-1/2 text-secondary" />
            <input type="text" className="w-full bg-app text-primary rounded-full pl-12 pr-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all shadow-sm" placeholder="Search by ref number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <select className="bg-app text-primary rounded-full px-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 appearance-none shadow-sm border border-transparent min-w-[160px]" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="Deposit">Deposit</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-app rounded-2xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app">
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Date & Time</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Ref Number</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Type</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2 text-right">Amount</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-4 text-right">From</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-4 text-right">To</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {filtered.map(tx => (
                  <tr key={tx.transaction_id} className="hover:bg-app/30 transition-colors">
                    <td className="py-4 px-2 text-[13px] text-secondary whitespace-nowrap">
                      {formatDateTime(tx.timestamp)}
                    </td>
                    <td className="py-4 px-2 text-[13px] font-mono tracking-widest text-[#81727E] uppercase whitespace-nowrap">
                      {tx.transaction_ref || '—'}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-primary">
                        {tx.type === 'Deposit' ? <ArrowDownRight size={16} className="text-accent-teal" /> :
                          tx.type === 'Withdrawal' ? <ArrowUpRight size={16} className="text-accent-rose" /> :
                            <ArrowLeftRight size={16} className="text-secondary" />}
                        {tx.type}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-semibold font-mono tracking-wide whitespace-nowrap">
                      <span className={tx.type === 'Deposit' ? 'text-accent-teal' : tx.type === 'Withdrawal' ? 'text-accent-rose' : 'text-primary'}>
                        ₹{fmt(Number(tx.amount))}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono tracking-wide text-secondary text-[12px]">
                      {tx.from_account_id ? tx.from_account_id.slice(0, 8) + '...' : '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tracking-wide text-secondary text-[12px]">
                      {tx.to_account_id ? tx.to_account_id.slice(0, 8) + '...' : '—'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {tx.status === 'Pending_Approval' && user?.role !== 'staff' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApprove(tx.transaction_id, 'Completed')} className="px-3 py-1 rounded-full text-[11px] font-medium bg-accent-teal/10 text-accent-teal hover:bg-accent-teal hover:text-white transition-all">Approve</button>
                          <button onClick={() => handleApprove(tx.transaction_id, 'Failed')} className="px-3 py-1 rounded-full text-[11px] font-medium bg-accent-rose/10 text-accent-rose hover:bg-accent-rose hover:text-white transition-all">Reject</button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wide min-w-[70px] ${tx.status === 'Completed' ? 'bg-accent-teal/10 text-accent-teal' :
                            tx.status === 'Failed' ? 'bg-accent-rose/10 text-accent-rose' :
                              'bg-accent-gold/10 text-accent-gold'
                          }`}>
                          {tx.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-16">
                      {searchTerm ? 'No transactions match search criteria.' : 'No transactions found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
