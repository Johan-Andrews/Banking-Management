import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Accounts() {
  const { customerId } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('Savings');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    // Generate a random 12-digit account number as a mockup for "KYC approved" issuance
    const generatedAccNo = 'AC' + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    try {
      const { error } = await supabase.from('account').insert([{
        customer_id: customerId,
        account_type: accountType,
        account_number: generatedAccNo,
        balance: 5000.00, // Promotional starting balance
        status: 'Active',
      }]);

      if (error) throw error;
      
      setMsg({ text: `Success! Created newly opened ${accountType} account: # ${generatedAccNo}. Starting balance: ₹5,000 added.`, type: 'success' });
      
      // Let them read it for a moment, then redirect to Dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setMsg({ text: err.message, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Open New Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Instantly open a Savings or Current checking account online.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '500px' }}>
        {msg.text && (
          <div className={`badge ${msg.type}`} style={{ padding: '16px', display: 'block', marginBottom: '20px', borderRadius: '8px', fontSize: '0.9rem', textTransform: 'none' }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <CreditCard size={32} color="var(--accent-blue)" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>KYC Approved Standard</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Your digital KYC lets you open instantly.</p>
          </div>
        </div>

        <form onSubmit={handleOpenAccount}>
          <div className="form-group">
            <label>Select Account Type</label>
            <select className="form-control" value={accountType} onChange={e => setAccountType(e.target.value)}>
              <option value="Savings">Savings Account</option>
              <option value="Current">Current Account</option>
            </select>
          </div>

          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Note:</strong> By clicking Open Account, you agree to our banking terms. 
            A complimentary starting balance of ₹5,000 will be credited directly to your account immediately.
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={loading}>
            <PlusCircle size={18} />
            {loading ? 'Processing network connection...' : 'Confirm & Open Account'}
          </button>
        </form>
      </div>
    </>
  );
}
