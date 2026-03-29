import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, AlertCircle } from 'lucide-react';

export default function Transfer() {
  const { customerId } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  
  const [fromAccount, setFromAccount] = useState('');
  const [toAccountType, setToAccountType] = useState('internal');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: accs } = await supabase.from('account').select('*').eq('customer_id', customerId);
      const { data: bens } = await supabase.from('beneficiary').select('*').eq('customer_id', customerId);
      if (accs) {
        setAccounts(accs);
        if (accs.length > 0) setFromAccount(accs[0].account_id);
      }
      if (bens) setBeneficiaries(bens);
    }
    loadData();
  }, [customerId]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      // Create a transaction record - Triggers will do the math!
      const payload: any = {
        amount: parseFloat(amount),
        type: 'Transfer',
        from_account_id: fromAccount,
      };

      if (toAccountType === 'internal') {
        payload.to_account_id = toAccountId;
      } else {
        payload.beneficiary_id = toAccountId;
      }

      const { error } = await supabase.from('transaction').insert([payload]);

      if (error) {
        throw new Error(error.message);
      }

      setStatusMsg({ text: 'Transfer completed successfully. Balances matched via database trigger.', type: 'success' });
      setAmount('');
    } catch (err: any) {
      // Format PostgREST error messages from our PL/pgSQL RAISE EXCEPTION calls
      setStatusMsg({ text: err.message, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Fund Transfers</h1>
          <p style={{ color: 'var(--text-muted)' }}>Send money securely via internal routing or NEFT/RTGS.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0' }}>
        {statusMsg.text && (
          <div className={`badge ${statusMsg.type}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '0.9rem', borderRadius: '8px' }}>
            <AlertCircle size={20} />
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleTransfer}>
          <div className="form-group">
            <label>Transfer From</label>
            <select className="form-control" value={fromAccount} onChange={e => setFromAccount(e.target.value)} required>
              {accounts.map(acc => (
                <option key={acc.account_id} value={acc.account_id}>
                  {acc.account_type} - {acc.account_number} (Bal: ₹{acc.balance})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <input type="radio" name="ttype" checked={toAccountType === 'internal'} onChange={() => setToAccountType('internal')} />
              Internal Account
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <input type="radio" name="ttype" checked={toAccountType === 'external'} onChange={() => setToAccountType('external')} />
              Saved Beneficiary (NEFT/RTGS)
            </label>
          </div>

          <div className="form-group">
            <label>{toAccountType === 'internal' ? 'Destination Account UUID (Internal)' : 'Select Beneficiary'}</label>
            {toAccountType === 'internal' ? (
              <input type="text" className="form-control" placeholder="Enter target account ID" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required />
            ) : (
              <select className="form-control" value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                <option value="">-- Choose Beneficiary --</option>
                {beneficiaries.map(ben => (
                  <option key={ben.beneficiary_id} value={ben.beneficiary_id}>
                    {ben.payee_name} - {ben.bank_name} ({ben.account_number})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" min="1" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
            <small style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Transfers &gt; ₹1,00,000 require Admin Approval as per business rule 5.5.
            </small>
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '12px' }} disabled={loading}>
            <Send size={18} />
            {loading ? 'Processing...' : 'Execute Transfer'}
          </button>
        </form>
      </div>
    </>
  );
}
