import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Search, Building2, Globe } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;
type TransferMode = 'internal' | 'beneficiary' | 'external';

interface AccountInfo {
  account_id: string;
  account_number: string;
  account_type: string;
  customer_name?: string;
  branch_name?: string;
  status?: string;
}

export default function Transfer() {
  const { user } = useAuth();
  const customerId = user?.id;
  const [accounts, setAccounts] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  const [step, setStep] = useState<Step>(1);
  const [fromAccount, setFromAccount] = useState('');
  const [transferMode, setTransferMode] = useState<TransferMode>('internal');

  // Internal transfer state
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [toAccountInfo, setToAccountInfo] = useState<AccountInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Beneficiary transfer state
  const [selectedBenId, setSelectedBenId] = useState('');

  // External transfer state
  const [extPayeeName, setExtPayeeName] = useState('');
  const [extAccountNumber, setExtAccountNumber] = useState('');
  const [extIfscCode, setExtIfscCode] = useState('');
  const [extBankName, setExtBankName] = useState('');
  const [extBranchName, setExtBranchName] = useState('');

  const [amount, setAmount] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: accs } = await supabase
        .from('account')
        .select('*, branch:branch_id (branch_name), customer:customer_id (name)')
        .eq('customer_id', customerId);
      const { data: bens } = await supabase
        .from('beneficiary')
        .select('*')
        .eq('customer_id', customerId);
      if (accs) setAccounts(accs);
      if (bens) setBeneficiaries(bens);
    }
    loadData();
  }, [customerId]);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const selectedFrom = accounts.find(a => a.account_id === fromAccount);
  const selectedBen = beneficiaries.find(b => b.beneficiary_id === selectedBenId);

  // Reset destination state when switching mode
  const switchMode = (mode: TransferMode) => {
    setTransferMode(mode);
    setToAccountNumber('');
    setToAccountInfo(null);
    setLookupError('');
    setSelectedBenId('');
    setExtPayeeName('');
    setExtAccountNumber('');
    setExtIfscCode('');
    setExtBankName('');
    setExtBranchName('');
  };

  // Look up internal account by account number
  const lookupAccount = async () => {
    if (!toAccountNumber.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    setToAccountInfo(null);

    try {
      const { data, error } = await supabase
        .from('account')
        .select('account_id, account_number, account_type, status, customer:customer_id (name), branch:branch_id (branch_name)')
        .eq('account_number', toAccountNumber.trim())
        .single();

      if (error || !data) {
        setLookupError('No account found with this number. Please verify and try again.');
        return;
      }

      if (data.account_id === fromAccount) {
        setLookupError('Cannot transfer to the same source account.');
        return;
      }

      setToAccountInfo({
        account_id: data.account_id,
        account_number: data.account_number,
        account_type: data.account_type,
        customer_name: (data.customer as any)?.name || 'Account Holder',
        branch_name: (data.branch as any)?.branch_name || 'N/A',
        status: data.status,
      });
    } catch {
      setLookupError('Failed to look up account. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleTransfer = async () => {
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const payload: any = {
        amount: parseFloat(amount),
        type: 'Transfer',
        from_account_id: fromAccount,
      };

      if (transferMode === 'internal') {
        if (!toAccountInfo) throw new Error('No destination account selected.');
        payload.to_account_id = toAccountInfo.account_id;
      } else if (transferMode === 'beneficiary') {
        if (!selectedBenId) throw new Error('No beneficiary selected.');
        payload.beneficiary_id = selectedBenId;
      } else if (transferMode === 'external') {
        // First, save the external details as a new beneficiary
        if (!extPayeeName || !extAccountNumber || !extIfscCode || !extBankName) {
          throw new Error('Please fill in all external account details.');
        }

        const { data: benData, error: benError } = await supabase
          .from('beneficiary')
          .insert([{
            customer_id: customerId,
            payee_name: extPayeeName,
            account_number: extAccountNumber,
            ifsc_code: extIfscCode,
            bank_name: extBankName,
          }])
          .select()
          .single();

        if (benError) throw new Error(benError.message);
        payload.beneficiary_id = benData.beneficiary_id;
      }

      const { error } = await supabase.from('transaction').insert([payload]);
      if (error) throw new Error(error.message);

      setStatusMsg({ text: 'Transfer completed successfully! Balances updated via database trigger.', type: 'success' });
      setAmount('');
      setToAccountNumber('');
      setToAccountInfo(null);
      setSelectedBenId('');
      setExtPayeeName('');
      setExtAccountNumber('');
      setExtIfscCode('');
      setExtBankName('');
      setExtBranchName('');
      setStep(1);

      // Reload beneficiaries if external transfer was made
      if (transferMode === 'external') {
        const { data: bens } = await supabase.from('beneficiary').select('*').eq('customer_id', customerId);
        if (bens) setBeneficiaries(bens);
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message, type: 'danger' });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Source' },
    { num: 2, label: 'Destination' },
    { num: 3, label: 'Amount' },
    { num: 4, label: 'Confirm' },
  ];

  const canProceed = () => {
    if (step === 1) return !!fromAccount;
    if (step === 2) {
      if (transferMode === 'internal') return !!toAccountInfo;
      if (transferMode === 'beneficiary') return !!selectedBenId;
      if (transferMode === 'external') return !!extPayeeName && !!extAccountNumber && !!extIfscCode && !!extBankName;
    }
    if (step === 3) return !!amount && parseFloat(amount) > 0;
    return true;
  };

  // Build review rows based on transfer mode
  const getReviewRows = () => {
    const rows: { label: string; value: string; highlight?: boolean }[] = [
      { label: 'From Account', value: selectedFrom ? `${selectedFrom.account_type} — ${selectedFrom.account_number}` : '' },
      { label: 'From Branch', value: selectedFrom?.branch?.branch_name || 'N/A' },
    ];

    if (transferMode === 'internal') {
      rows.push({ label: 'To Account', value: toAccountInfo ? `${toAccountInfo.customer_name} — ${toAccountInfo.account_number}` : '' });
      rows.push({ label: 'To Branch', value: toAccountInfo?.branch_name || 'N/A' });
      rows.push({ label: 'Transfer Type', value: 'Internal Transfer' });
    } else if (transferMode === 'beneficiary') {
      rows.push({ label: 'To Beneficiary', value: selectedBen ? `${selectedBen.payee_name} — ${selectedBen.bank_name}` : '' });
      rows.push({ label: 'Account No.', value: selectedBen?.account_number || '' });
      rows.push({ label: 'IFSC', value: selectedBen?.ifsc_code || '' });
      rows.push({ label: 'Transfer Type', value: 'Beneficiary (NEFT/RTGS)' });
    } else {
      rows.push({ label: 'To Payee', value: extPayeeName });
      rows.push({ label: 'Account No.', value: extAccountNumber });
      rows.push({ label: 'IFSC Code', value: extIfscCode });
      rows.push({ label: 'Bank', value: `${extBankName}${extBranchName ? ` — ${extBranchName}` : ''}` });
      rows.push({ label: 'Transfer Type', value: 'External Transfer (NEFT/RTGS)' });
    }

    rows.push({ label: 'Transfer Amount', value: `₹${fmt(parseFloat(amount) || 0)}`, highlight: true });
    return rows;
  };

  return (
    <>
      <div className="page-header fade-in">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>Fund Transfer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Send money via internal routing, saved beneficiaries, or external NEFT/RTGS
          </p>
        </div>
      </div>

      <div className="glass-panel-static fade-in delay-1" style={{ maxWidth: '720px' }}>
        {/* Status */}
        {statusMsg.text && (
          <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {statusMsg.text}
          </div>
        )}

        {/* Wizard Steps */}
        <div className="wizard-steps">
          {steps.map((s) => (
            <div key={s.num} className={`wizard-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
              <div className="wizard-dot">
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className="wizard-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Source Account */}
        {step === 1 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '16px' }}>Select Source Account</h3>
            <div className="form-group">
              <label>Transfer From</label>
              <select className="form-control" value={fromAccount} onChange={e => setFromAccount(e.target.value)}>
                <option value="">— Select Source Account —</option>
                {accounts.filter(a => a.status === 'Active').map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type} — {acc.account_number} (₹{fmt(Number(acc.balance))})
                  </option>
                ))}
              </select>
            </div>
            {selectedFrom && (
              <div style={{ padding: '14px', background: 'rgba(var(--accent-primary-rgb), 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(var(--accent-primary-rgb), 0.15)' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Available Balance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                  ₹{fmt(Number(selectedFrom.balance))}
                </div>
                {selectedFrom.branch?.branch_name && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} /> {selectedFrom.branch.branch_name} Branch
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Destination */}
        {step === 2 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '16px' }}>Choose Destination</h3>

            {/* Mode Toggle — 3 buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                className={transferMode === 'internal' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, fontSize: '0.82rem', padding: '10px 12px' }}
                onClick={() => switchMode('internal')}
              >
                Internal Account
              </button>
              <button
                type="button"
                className={transferMode === 'beneficiary' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, fontSize: '0.82rem', padding: '10px 12px' }}
                onClick={() => switchMode('beneficiary')}
              >
                Beneficiary (NEFT)
              </button>
              <button
                type="button"
                className={transferMode === 'external' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, fontSize: '0.82rem', padding: '10px 12px' }}
                onClick={() => switchMode('external')}
              >
                <Globe size={14} style={{ marginRight: '4px' }} />
                External Transfer
              </button>
            </div>

            {/* --- Internal: Account Number Lookup --- */}
            {transferMode === 'internal' && (
              <>
                <div className="form-group">
                  <label>Destination Account Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. AC1234567890"
                      value={toAccountNumber}
                      onChange={e => { setToAccountNumber(e.target.value); setToAccountInfo(null); setLookupError(''); }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={lookupAccount}
                      disabled={lookupLoading || !toAccountNumber.trim()}
                      style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
                    >
                      {lookupLoading ? (
                        <div className="spinner" style={{ width: '16px', height: '16px', borderColor: 'rgba(6,11,24,0.2)', borderTopColor: '#060B18' }} />
                      ) : (
                        <><Search size={16} /> Verify</>
                      )}
                    </button>
                  </div>
                </div>

                {lookupError && (
                  <div className="alert alert-danger" style={{ marginTop: '4px' }}>
                    <AlertCircle size={16} /> {lookupError}
                  </div>
                )}

                {toAccountInfo && (
                  <div style={{
                    padding: '18px', marginTop: '8px',
                    background: 'rgba(var(--success-rgb), 0.08)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(var(--success-rgb), 0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle2 size={18} color="var(--success)" />
                      <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.88rem' }}>Account Verified</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Account Holder', value: toAccountInfo.customer_name },
                        { label: 'Account Type', value: toAccountInfo.account_type },
                        { label: 'Account Number', value: toAccountInfo.account_number },
                        { label: 'Branch', value: toAccountInfo.branch_name },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{item.label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- Beneficiary: Dropdown --- */}
            {transferMode === 'beneficiary' && (
              <div className="form-group">
                <label>Select Beneficiary</label>
                <select className="form-control" value={selectedBenId} onChange={e => setSelectedBenId(e.target.value)}>
                  <option value="">— Choose Beneficiary —</option>
                  {beneficiaries.map(ben => (
                    <option key={ben.beneficiary_id} value={ben.beneficiary_id}>
                      {ben.payee_name} — {ben.bank_name} ({ben.account_number})
                    </option>
                  ))}
                </select>
                {selectedBen && (
                  <div style={{
                    padding: '14px', marginTop: '12px',
                    background: 'rgba(var(--accent-secondary-rgb), 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(var(--accent-secondary-rgb), 0.15)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                      <div><span style={{ color: 'var(--text-tertiary)' }}>Name:</span> <span style={{ fontWeight: 600 }}>{selectedBen.payee_name}</span></div>
                      <div><span style={{ color: 'var(--text-tertiary)' }}>Bank:</span> <span style={{ fontWeight: 600 }}>{selectedBen.bank_name}</span></div>
                      <div><span style={{ color: 'var(--text-tertiary)' }}>A/C:</span> <span className="text-mono" style={{ fontWeight: 600 }}>{selectedBen.account_number}</span></div>
                      <div><span style={{ color: 'var(--text-tertiary)' }}>IFSC:</span> <span className="text-mono" style={{ fontWeight: 600 }}>{selectedBen.ifsc_code}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- External: Manual Entry --- */}
            {transferMode === 'external' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div className="form-group">
                  <label>Payee Name</label>
                  <input type="text" className="form-control" placeholder="Full name of the recipient"
                    value={extPayeeName} onChange={e => setExtPayeeName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input type="text" className="form-control" placeholder="Recipient's bank account number"
                    value={extAccountNumber} onChange={e => setExtAccountNumber(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input type="text" className="form-control" placeholder="e.g. SBIN0001234"
                      value={extIfscCode} onChange={e => setExtIfscCode(e.target.value.toUpperCase())} />
                  </div>
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input type="text" className="form-control" placeholder="e.g. State Bank of India"
                      value={extBankName} onChange={e => setExtBankName(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Branch Name <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <input type="text" className="form-control" placeholder="e.g. MG Road Branch"
                    value={extBranchName} onChange={e => setExtBranchName(e.target.value)} />
                </div>
                <div className="alert alert-info" style={{ marginTop: '0' }}>
                  <AlertCircle size={16} />
                  External transfer details will be saved as a beneficiary for future use.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Amount */}
        {step === 3 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '16px' }}>Enter Amount</h3>
            <div className="form-group">
              <label>Transfer Amount (₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '20px' }}
              />
            </div>
            {selectedFrom && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                Available: <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>₹{fmt(Number(selectedFrom.balance))}</span>
              </div>
            )}
            <div className="alert alert-warning" style={{ marginTop: '4px' }}>
              <AlertCircle size={16} />
              Transfers exceeding ₹1,00,000 require Admin approval (Business Rule).
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="fade-in">
            <h3 style={{ marginBottom: '16px' }}>Review & Confirm</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getReviewRows().map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: row.highlight ? 'var(--accent-primary)' : 'var(--text-primary)', fontFamily: row.highlight ? 'var(--font-mono)' : undefined }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-between" style={{ marginTop: '28px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setStep((step - 1) as Step)}
            disabled={step === 1}
            style={{ opacity: step === 1 ? 0.3 : 1 }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canProceed()}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleTransfer}
              disabled={loading}
              style={{ minWidth: '180px' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderColor: 'rgba(6,11,24,0.2)', borderTopColor: '#060B18' }} />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={16} /> Execute Transfer
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
