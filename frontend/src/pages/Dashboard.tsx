import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function Dashboard() {
  const { customerId } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      // Fetch Customer Info
      const { data: custData } = await supabase
        .from('customer')
        .select('name')
        .eq('customer_id', customerId)
        .single();
      
      if (custData) setCustomerName(custData.name);

      // Fetch Accounts
      const { data: accData } = await supabase
        .from('account')
        .select('*')
        .eq('customer_id', customerId);
        
      if (accData) setAccounts(accData);

      // Fetch Recent Transactions
      if (accData && accData.length > 0) {
        const accountIds = accData.map(a => a.account_id);
        const { data: txData } = await supabase
          .from('transaction')
          .select('*')
          .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`)
          .order('timestamp', { ascending: false })
          .limit(10);
          
        if (txData) setTransactions(txData);
      }
      
      setLoading(false);
    }
    
    if (customerId) loadDashboard();
  }, [customerId]);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading account details...</div>;

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Welcome back, {customerName}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Here is a summary of your accounts.</p>
        </div>
        <button className="btn-primary" onClick={() => window.print()}>
          Download Mini-Statement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Total Wealth Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
            <Wallet size={120} />
          </div>
          <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em' }}>Total Net Balance</span>
          <h2 style={{ fontSize: '2.5rem', margin: '8px 0', color: 'var(--accent-gold)' }}>
            ₹ {totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.85rem' }}>
            <TrendingUp size={16} /> <span>+2.4% from last month</span>
          </div>
        </div>

        {/* Individual Accounts */}
        {accounts.map(acc => (
          <div key={acc.account_id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{acc.account_type} Account</span>
              <span className={`badge ${acc.status === 'Active' ? 'success' : 'danger'}`}>{acc.status}</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginTop: '12px', fontFamily: 'monospace', letterSpacing: '2px' }}>
              {acc.account_number.match(/.{1,4}/g)?.join(' ')}
            </h3>
            <div style={{ marginTop: '16px', fontSize: '1.5rem', fontWeight: 600 }}>
              ₹ {Number(acc.balance).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ marginTop: '12px' }}>
        <h3 style={{ marginBottom: '16px' }}>Recent Transactions (Last 10)</h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No recent transactions found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref Number</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const isDebit = tx.from_account_id && accounts.some(a => a.account_id === tx.from_account_id);
                return (
                  <tr key={tx.transaction_id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{tx.transaction_ref}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isDebit ? <ArrowUpRight size={16} color="var(--danger)" /> : <ArrowDownRight size={16} color="var(--success)" />}
                        {tx.type}
                      </div>
                    </td>
                    <td style={{ color: isDebit ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      {isDebit ? '-' : '+'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge ${tx.status === 'Completed' ? 'success' : 'warning'}`}>
                         {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
