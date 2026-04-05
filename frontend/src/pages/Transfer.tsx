import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Search, Building2 } from 'lucide-react';
import { formatDate } from '../lib/utils';

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
  const [scheduledDate, setScheduledDate] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

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

      if (scheduledDate) {
        payload.is_scheduled = true;
        payload.scheduled_for = scheduledDate;
        payload.status = 'Scheduled';
      }

      if (transferMode === 'internal') {
        if (!toAccountInfo) throw new Error('No destination account selected.');
        payload.to_account_id = toAccountInfo.account_id;
      } else if (transferMode === 'beneficiary') {
        if (!selectedBenId) throw new Error('No beneficiary selected.');
        payload.beneficiary_id = selectedBenId;
      } else if (transferMode === 'external') {
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
            bypass_cooling: true,
          }])
          .select()
          .single();

        if (benError) throw new Error(benError.message);
        payload.beneficiary_id = benData.beneficiary_id;
      }

      const { error } = await supabase.from('transaction').insert([payload]);
      if (error) throw new Error(error.message);

      setStatusMsg({ text: 'Transfer completed successfully! Balances updated.', type: 'success' });
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      setAmount('');
      setScheduledDate('');
      setToAccountNumber('');
      setToAccountInfo(null);
      setSelectedBenId('');
      setExtPayeeName('');
      setExtAccountNumber('');
      setExtIfscCode('');
      setExtBankName('');
      setExtBranchName('');
      setStep(1);

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
    if (scheduledDate) {
      rows.push({ label: 'Scheduled Details', value: `Executes on ${formatDate(scheduledDate)}`});
    }
    return rows;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Fund Transfer</h1>
        <p className="text-sm text-secondary mt-1">Send money via internal routing, saved beneficiaries, or external NEFT/RTGS</p>
      </div>

      <div className="bg-card rounded-[40px] p-8 md:p-12 shadow-sm transition-all duration-300">
        
        {statusMsg.text && (
          <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${statusMsg.type === 'success' ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20' : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {statusMsg.text}
          </div>
        )}

        {showNotification && (
          <div className="fixed bottom-4 right-4 max-w-sm bg-white border-l-4 border-accent-teal shadow-2xl p-4 rounded-lg z-50 animate-in slide-in-from-bottom-5">
            <h4 className="text-secondary font-bold text-xs uppercase tracking-wide mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> SMS / EMAIL DISPATCHED</h4>
            <p className="text-sm text-primary mb-1">Dear {selectedFrom?.customer?.name}, your transfer of ₹{fmt(parseFloat(amount))} has been completed successfully.</p>
            <p className="text-xs text-secondary italic">Transaction Ref: Generated securely.</p>
          </div>
        )}

        {/* Wizard Progress */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-app -z-10" />
          <div className="absolute top-[14px] left-0 h-[2px] bg-secondary transition-all duration-500 -z-10" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 bg-card p-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                step > s.num ? 'bg-secondary text-white' : step === s.num ? 'bg-secondary text-white ring-4 ring-secondary/20' : 'bg-app text-secondary'
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-[12px] font-medium hidden md:block ${step >= s.num ? 'text-primary' : 'text-secondary'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Form Content Wrapper */}
        <div className="min-h-[300px]">
          
          {/* Step 1: Source Account */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-xl font-medium text-primary mb-6">Select Source Account</h3>
              <div className="space-y-4 max-w-lg">
                <label className="block text-sm font-medium text-primary">Transfer From</label>
                <select 
                  className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30 appearance-none border border-transparent shadow-sm"
                  value={fromAccount} 
                  onChange={e => setFromAccount(e.target.value)}
                >
                  <option value="" disabled>— Select Source Account —</option>
                  {accounts.filter(a => a.status === 'Active').map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.account_type} — {acc.account_number} (₹{fmt(Number(acc.balance))})
                    </option>
                  ))}
                </select>
                
                {selectedFrom && (
                  <div className="mt-8 bg-elevated rounded-[24px] p-6 border border-black/5">
                    <div className="text-sm text-secondary mb-1">Available Balance</div>
                    <div className="text-3xl font-bold tracking-tight text-primary font-mono mb-2">
                      ₹{fmt(Number(selectedFrom.balance))}
                    </div>
                    {selectedFrom.branch?.branch_name && (
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <Building2 size={16} /> {selectedFrom.branch.branch_name} Branch
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Destination */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl">
              <h3 className="text-xl font-medium text-primary mb-6">Choose Destination</h3>

              {/* Mode Toggle */}
              <div className="flex bg-app rounded-full p-1 mb-8 shadow-sm">
                {(['internal', 'beneficiary', 'external'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`flex-1 py-3 px-4 text-sm font-medium rounded-full transition-all capitalize whitespace-nowrap ${
                      transferMode === mode ? 'bg-elevated text-primary shadow-sm' : 'text-secondary hover:text-primary'
                    }`}
                    onClick={() => switchMode(mode)}
                  >
                    {mode === 'external' ? 'External' : mode}
                  </button>
                ))}
              </div>

              {/* Internal */}
              {transferMode === 'internal' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-primary">Destination Account Number</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30 border border-transparent"
                      placeholder="e.g. AC1234567890"
                      value={toAccountNumber}
                      onChange={e => { setToAccountNumber(e.target.value); setToAccountInfo(null); setLookupError(''); }}
                    />
                    <button
                      type="button"
                      className="bg-secondary text-white rounded-full px-6 font-medium hover:bg-[#6c5e6a] transition-colors disabled:opacity-50 tracking-wide flex items-center gap-2"
                      onClick={lookupAccount}
                      disabled={lookupLoading || !toAccountNumber.trim()}
                    >
                      {lookupLoading ? '...' : <><Search size={16} /> Verify</>}
                    </button>
                  </div>
                  
                  {lookupError && <p className="text-sm text-accent-rose mt-2 px-2">{lookupError}</p>}

                  {toAccountInfo && (
                    <div className="mt-6 bg-accent-teal/5 border border-accent-teal/20 rounded-[24px] p-6">
                      <div className="flex items-center gap-2 text-accent-teal font-medium mb-4">
                        <CheckCircle2 size={20} /> Account Verified
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Account Holder', value: toAccountInfo.customer_name },
                          { label: 'Account Type', value: toAccountInfo.account_type },
                          { label: 'Account Number', value: toAccountInfo.account_number },
                          { label: 'Branch', value: toAccountInfo.branch_name },
                        ].map(item => (
                          <div key={item.label}>
                            <div className="text-[11px] uppercase tracking-wider text-secondary mb-1">{item.label}</div>
                            <div className="text-[14px] font-medium text-primary">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Beneficiary */}
              {transferMode === 'beneficiary' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-primary">Select Saved Beneficiary</label>
                  <select 
                    className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30 appearance-none border border-transparent shadow-sm"
                    value={selectedBenId} 
                    onChange={e => setSelectedBenId(e.target.value)}
                  >
                    <option value="" disabled>— Choose Beneficiary —</option>
                    {beneficiaries.map(ben => (
                      <option key={ben.beneficiary_id} value={ben.beneficiary_id}>
                        {ben.payee_name} — {ben.bank_name} ({ben.account_number})
                      </option>
                    ))}
                  </select>
                  
                  {selectedBen && (
                    <div className="mt-6 bg-elevated rounded-[24px] p-6 border border-black/5 grid grid-cols-2 gap-4">
                      <div><span className="block text-[11px] uppercase tracking-wider text-secondary mb-1">Name</span> <span className="text-[14px] font-medium text-primary">{selectedBen.payee_name}</span></div>
                      <div><span className="block text-[11px] uppercase tracking-wider text-secondary mb-1">Bank</span> <span className="text-[14px] font-medium text-primary">{selectedBen.bank_name}</span></div>
                      <div><span className="block text-[11px] uppercase tracking-wider text-secondary mb-1">A/C Number</span> <span className="text-[14px] font-medium font-mono tracking-wide text-primary">{selectedBen.account_number}</span></div>
                      <div><span className="block text-[11px] uppercase tracking-wider text-secondary mb-1">IFSC</span> <span className="text-[14px] font-medium font-mono tracking-wide text-primary">{selectedBen.ifsc_code}</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* External */}
              {transferMode === 'external' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary px-2">Payee Name</label>
                    <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="Full name of the recipient"
                      value={extPayeeName} onChange={e => setExtPayeeName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary px-2">Account Number</label>
                    <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="Recipient's bank account number"
                      value={extAccountNumber} onChange={e => setExtAccountNumber(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-primary px-2">IFSC Code</label>
                      <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. SBIN0001234"
                        value={extIfscCode} onChange={e => setExtIfscCode(e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-primary px-2">Bank Name</label>
                      <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. State Bank of India"
                        value={extBankName} onChange={e => setExtBankName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary px-2">Branch Name <span className="text-secondary font-normal">(optional)</span></label>
                    <input type="text" className="w-full bg-app text-primary rounded-full px-5 py-4 focus:outline-none focus:ring-2 focus:ring-secondary/30" placeholder="e.g. MG Road Branch"
                      value={extBranchName} onChange={e => setExtBranchName(e.target.value)} />
                  </div>
                  <div className="mt-4 p-4 bg-app rounded-2xl flex gap-3 text-sm text-secondary items-start">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p>External transfer details will be saved as a beneficiary for future use.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Amount */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-lg">
              <h3 className="text-xl font-medium text-primary mb-6">Enter Amount</h3>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-light text-secondary">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="w-full bg-app text-primary font-mono text-3xl font-medium tracking-wide rounded-[32px] pl-16 pr-8 py-8 focus:outline-none focus:ring-2 focus:ring-secondary/30 placeholder-secondary/30"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                
                {selectedFrom && (
                  <div className="flex justify-between items-center px-4">
                    <span className="text-secondary text-sm">Available Balance</span>
                    <span className="text-primary font-mono font-medium tracking-wide">₹{fmt(Number(selectedFrom.balance))}</span>
                  </div>
                )}

                {selectedFrom && parseFloat(amount) > selectedFrom.daily_transaction_limit && (
                   <div className="p-4 bg-accent-rose/10 rounded-2xl flex gap-3 text-sm text-accent-rose items-start font-medium">
                     <AlertCircle size={18} className="shrink-0 mt-0.5" />
                     <p>Warning: Amount exceeds your daily limit of ₹{fmt(Number(selectedFrom.daily_transaction_limit))}. Your transaction will fail.</p>
                   </div>
                )}

                <div className="pt-4 border-t border-app">
                  <label className="block text-sm font-medium text-primary mb-2">Schedule Transfer (Optional)</label>
                  <input
                    type="date"
                    className="w-full bg-app text-primary rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all border border-transparent shadow-sm"
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]}
                    onChange={e => setScheduledDate(e.target.value)}
                  />
                  <p className="text-xs text-secondary mt-2 px-2">Leave blank to execute immediately. You can schedule up to 30 days in advance (REQ-12C).</p>
                </div>
                
                <div className="p-4 bg-accent-gold/10 rounded-2xl flex gap-3 text-sm text-accent-gold items-start">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>Transfers exceeding ₹1,00,000 require Manager/Admin approval according to compliance rules.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-xl">
              <h3 className="text-xl font-medium text-primary mb-6">Review & Confirm</h3>
              <div className="bg-app rounded-[32px] p-8 space-y-4">
                {getReviewRows().map((row, i) => (
                  <div key={i} className={`flex justify-between items-center py-3 ${i !== getReviewRows().length - 1 ? 'border-b border-card' : 'pt-6 mt-2 border-t border-card'}`}>
                    <span className="text-secondary text-sm">{row.label}</span>
                    <span className={`text-[15px] ${row.highlight ? 'text-2xl font-semibold text-primary font-mono tracking-wide' : 'font-medium text-primary'}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-12 pt-6 border-t border-app flex justify-between items-center">
          <button
            type="button"
            className="px-6 py-3 rounded-full text-secondary hover:text-primary hover:bg-app transition-colors font-medium flex items-center gap-2 disabled:opacity-0 disabled:pointer-events-none"
            onClick={() => setStep((step - 1) as Step)}
            disabled={step === 1}
          >
            <ArrowLeft size={18} /> Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              className="bg-primary text-white px-8 py-3 rounded-full font-medium tracking-wide hover:bg-[#362e34] transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2 shadow-md"
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canProceed()}
            >
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="bg-secondary text-white px-8 py-3 rounded-full font-medium tracking-wide hover:bg-[#6c5e6a] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg"
              onClick={handleTransfer}
              disabled={loading}
            >
              {loading ? 'Processing...' : <><Send size={18} /> Execute Transfer</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
