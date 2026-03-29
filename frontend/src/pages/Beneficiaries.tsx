import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Clock } from 'lucide-react';

export default function Beneficiaries() {
  const { customerId } = useAuth();
  const [bens, setBens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Beneficiary Forms
  const [name, setName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bank, setBank] = useState('');
  
  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('beneficiary').select('*').eq('customer_id', customerId);
    if (data) setBens(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [customerId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('beneficiary').insert([{
      customer_id: customerId,
      payee_name: name,
      account_number: accNum,
      ifsc_code: ifsc,
      bank_name: bank,
    }]);
    
    setName(''); setAccNum(''); setIfsc(''); setBank('');
    loadData();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Manage Beneficiaries</h1>
          <p style={{ color: 'var(--text-muted)' }}>Add saved payees for NEFT/RTGS transfers with 24-hour cooling.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '24px' }}>
        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <UserPlus size={20} color="var(--accent-blue)" /> Add New Payee
          </h3>
          <form onSubmit={handleAdd}>
            <div className="form-group"><input type="text" className="form-control" placeholder="Payee Name" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="form-group"><input type="text" className="form-control" placeholder="Account Number" value={accNum} onChange={e => setAccNum(e.target.value)} required /></div>
            <div className="form-group"><input type="text" className="form-control" placeholder="IFSC Code (e.g. HDFC0001234)" value={ifsc} onChange={e => setIfsc(e.target.value)} required /></div>
            <div className="form-group"><input type="text" className="form-control" placeholder="Bank Name" value={bank} onChange={e => setBank(e.target.value)} required /></div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save Beneficiary</button>
            <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '12px', textAlign: 'center' }}>
              <Clock size={12} style={{ marginRight: '4px' }}/> A 24-hour cooling period will apply.
            </p>
          </form>
        </div>

        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <h3>Saved Payees</h3>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Bank / IFSC</th><th>Account No</th><th>Date Added</th></tr>
            </thead>
            <tbody>
              {bens.map(b => (
                <tr key={b.beneficiary_id}>
                  <td style={{ fontWeight: 600 }}>{b.payee_name}</td>
                  <td>{b.bank_name}<br/><small style={{ color: 'var(--text-muted)' }}>{b.ifsc_code}</small></td>
                  <td style={{ fontFamily: 'monospace' }}>{b.account_number}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {bens.length === 0 && <tr><td colSpan={4} align="center" style={{ color: 'var(--text-muted)' }}>No beneficiaries saved.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
