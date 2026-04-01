import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Calendar, Calculator, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function Loans() {
  const { user } = useAuth();
  const customerId = user?.id;
  const [loans, setLoans] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('');
  const [type, setType] = useState('Personal');
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [closureMsg, setClosureMsg] = useState({ text: '', type: '' });

  const rateMap: Record<string, number> = { Personal: 12.5, Home: 8.5, Auto: 9.5, Education: 7.5 };

  async function loadData() {
    const { data: lnData } = await supabase.from('loan').select('*').eq('customer_id', customerId).order('applied_on', { ascending: false });
    if (lnData) {
      setLoans(lnData);
      const loanIds = lnData.map(l => l.loan_id);
      if (loanIds.length > 0) {
        const { data: schedData } = await supabase.from('repayment_schedule').select('*').in('loan_id', loanIds).order('due_date', { ascending: true });
        if (schedData) setSchedules(schedData);
      }
    }
  }

  useEffect(() => { loadData(); }, [customerId]);

  const emiPreview = useMemo(() => {
    const P = parseFloat(amount);
    const n = parseInt(tenure);
    const r = (rateMap[type] || 12.5) / 100 / 12;
    if (!P || !n || P <= 0 || n <= 0) return null;
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - P;
    return { emi, total, interest };
  }, [amount, tenure, type]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('loan').insert([{
      customer_id: customerId,
      principal_amount: parseFloat(amount),
      interest_rate: rateMap[type] || 12.5,
      tenure_months: parseInt(tenure),
      loan_type: type
    }]);
    setAmount(''); setTenure(''); setType('Personal');
    loadData();
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const fmtD = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const handlePreClose = async (loanId: string, principal: number) => {
    const penalty = principal * 0.02; // 2% penalty mock
    if (confirm(`Pre-closure penalty is 2% (₹${fmtD(penalty)}). Confirm closure request?`)) {
      await supabase.from('loan').update({ status: 'Closed' }).eq('loan_id', loanId);
      setClosureMsg({ text: `Pre-closure requested successfully! Penalty applied.`, type: 'success' });
      setTimeout(() => setClosureMsg({ text: '', type: '' }), 4000);
      loadData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Loan Services</h1>
        <p className="text-sm text-secondary mt-1">Apply for loans and track your EMI schedules.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Application Form (Left side sticky) */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-card rounded-[40px] p-8 shadow-sm lg:sticky lg:top-8">
            <h3 className="text-lg font-medium text-primary mb-6 flex items-center gap-2">
              <FileText size={20} className="text-secondary" /> Apply for Loan
            </h3>

            <form onSubmit={handleApply} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Loan Type</label>
                <select className="w-full bg-app text-primary rounded-full px-5 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-secondary/30 appearance-none shadow-sm" value={type} onChange={e => setType(e.target.value)}>
                  <option value="Personal">Personal Loan ({rateMap.Personal}% p.a.)</option>
                  <option value="Home">Home Loan ({rateMap.Home}% p.a.)</option>
                  <option value="Auto">Auto Loan ({rateMap.Auto}% p.a.)</option>
                  <option value="Education">Education Loan ({rateMap.Education}% p.a.)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Loan Amount (₹)</label>
                <input type="number" min="10000" className="w-full bg-app text-primary rounded-full px-5 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-secondary/30 shadow-sm" placeholder="e.g. 500000" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-medium text-primary px-2">Tenure (Months)</label>
                <input type="number" min="6" max="360" className="w-full bg-app text-primary rounded-full px-5 py-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-secondary/30 shadow-sm" placeholder="e.g. 60" value={tenure} onChange={e => setTenure(e.target.value)} required />
              </div>

              {/* EMI Preview Widget */}
              {emiPreview && (
                <div className="mt-6 bg-secondary/5 border border-secondary/10 rounded-[24px] p-5">
                  <div className="flex items-center gap-2 text-primary font-medium text-[13px] mb-4">
                    <Calculator size={16} /> EMI Calculator Preview
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondary mb-1">Monthly</div>
                      <div className="text-[14px] font-semibold text-primary font-mono tracking-wide">₹{fmt(emiPreview.emi)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondary mb-1">Interest</div>
                      <div className="text-[14px] font-semibold text-accent-rose font-mono tracking-wide">₹{fmt(emiPreview.interest)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-secondary mb-1">Total</div>
                      <div className="text-[14px] font-semibold text-secondary font-mono tracking-wide">₹{fmt(emiPreview.total)}</div>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="w-full mt-4 bg-secondary text-white rounded-full py-4 font-medium text-[15px] hover:bg-[#6c5e6a] transition-all active:scale-95 shadow-md flex items-center justify-center gap-2">
                <FileText size={18} /> Submit Application
              </button>
            </form>
          </div>
        </div>

        {/* Loans List */}
        <div className="flex-1 space-y-6">
          {closureMsg.text && (
            <div className="mb-4 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium bg-accent-teal/10 text-accent-teal border border-accent-teal/20 animate-in slide-in-from-top-2">
              <CheckCircle2 size={20} /> {closureMsg.text}
            </div>
          )}
          {loans.length === 0 ? (
            <div className="bg-card rounded-[40px] p-12 flex flex-col items-center justify-center text-secondary min-h-[400px]">
              <FileText size={48} className="mb-4 opacity-40" />
              <h4 className="text-lg font-medium text-primary mb-1">No Loans Found</h4>
              <p className="text-sm">Apply for your first loan using the form.</p>
            </div>
          ) : (
            loans.map(loan => {
              const loanSchedules = schedules.filter(s => s.loan_id === loan.loan_id);
              const isExpanded = expandedLoan === loan.loan_id;

              return (
                <div key={loan.loan_id} className="bg-card rounded-[32px] p-6 shadow-sm overflow-hidden transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-primary">{loan.loan_type} Loan</h4>
                      <p className="text-sm text-secondary mt-1">
                        {loan.tenure_months} months @ {loan.interest_rate}% p.a. • Applied {new Date(loan.applied_on).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {loan.status === 'Approved' && <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-accent-teal/10 text-accent-teal uppercase tracking-wide">Approved</span>}
                      {loan.status === 'Pending' && <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-accent-gold/10 text-accent-gold uppercase tracking-wide">Pending</span>}
                      {loan.status === 'Rejected' && <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-accent-rose/10 text-accent-rose uppercase tracking-wide">Rejected</span>}
                      
                      <div className="mt-2 text-xl font-semibold text-primary font-mono tracking-wide">
                        ₹{fmtD(Number(loan.principal_amount))}
                      </div>
                    </div>
                  </div>

                  {loanSchedules.length > 0 ? (
                    <>
                      <div className="my-5 h-px bg-app w-full" />
                      {loanSchedules.length > 0 && loan.status === 'Approved' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedLoan(isExpanded ? null : loan.loan_id)}
                            className="flex-1 bg-app hover:bg-app/80 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-medium text-secondary transition-colors"
                          >
                            <Calendar size={16} />
                            {isExpanded ? 'Hide' : 'Show'} EMI ({loanSchedules.length})
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          <button
                            onClick={() => handlePreClose(loan.loan_id, loan.principal_amount)}
                            className="bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose flex items-center justify-center px-4 py-3 rounded-2xl text-[13px] font-medium transition-colors"
                          >
                            Pre-Close
                          </button>
                        </div>
                      )}
                      {loanSchedules.length > 0 && loan.status !== 'Approved' && (
                        <button
                          onClick={() => setExpandedLoan(isExpanded ? null : loan.loan_id)}
                          className="w-full bg-app hover:bg-app/80 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-medium text-secondary transition-colors"
                        >
                          <Calendar size={16} />
                          {isExpanded ? 'Hide' : 'Show'} EMI Schedule ({loanSchedules.length} installments)
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}

                      {isExpanded && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          {loanSchedules.map((sch, i) => (
                            <div key={sch.schedule_id} className={`p-4 rounded-[20px] border ${sch.pay_status === 'Paid' ? 'bg-accent-teal/5 border-accent-teal/20' : sch.pay_status === 'Overdue' ? 'bg-accent-rose/5 border-accent-rose/20' : 'bg-app border-transparent'}`}>
                              <div className="text-[11px] text-secondary mb-1">M-{i + 1}: <span className="tracking-wide"> {new Date(sch.due_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span></div>
                              <div className="text-[15px] font-semibold text-primary font-mono mb-2 tracking-wide">₹{fmt(Number(sch.emi_amount))}</div>
                              
                              {sch.pay_status === 'Paid' && <span className="inline-flex items-center gap-1 text-[10px] text-accent-teal font-medium tracking-wide"><CheckCircle2 size={12}/> PAID</span>}
                              {sch.pay_status === 'Pending' && <span className="inline-flex items-center gap-1 text-[10px] text-accent-gold font-medium tracking-wide"><Clock size={12}/> PENDING</span>}
                              {sch.pay_status === 'Overdue' && <span className="inline-flex items-center gap-1 text-[10px] text-accent-rose font-medium tracking-wide"><AlertCircle size={12}/> OVERDUE</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 p-4 bg-app rounded-2xl flex items-start gap-3">
                      <AlertCircle size={18} className="text-secondary shrink-0 mt-0.5" />
                      <p className="text-sm text-secondary">
                        {loan.status === 'Pending' ? 'EMI Schedule will be auto-generated upon admin approval.' : 'No schedule generated.'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
