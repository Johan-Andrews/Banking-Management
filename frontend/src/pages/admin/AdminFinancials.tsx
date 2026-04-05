import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown, ArrowLeftRight, Wallet, PiggyBank, BadgeDollarSign } from 'lucide-react';

export default function AdminFinancials() {
  const [data, setData] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransfers: 0,
    depositCount: 0,
    withdrawalCount: 0,
    transferCount: 0,
    totalBalanceInBank: 0,
    totalLoanDisbursed: 0,
    totalEmiCollected: 0,
    pendingLoanAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [deposits, withdrawals, transfers, accounts, approvedLoans, paidEmi, pendingLoans] = await Promise.all([
        supabase.from('transaction').select('amount').eq('type', 'Deposit').eq('status', 'Completed'),
        supabase.from('transaction').select('amount').eq('type', 'Withdrawal').eq('status', 'Completed'),
        supabase.from('transaction').select('amount').eq('type', 'Transfer').eq('status', 'Completed'),
        supabase.from('account').select('balance'),
        supabase.from('loan').select('principal_amount').eq('status', 'Approved'),
        supabase.from('repayment_schedule').select('emi_amount').eq('pay_status', 'Paid'),
        supabase.from('loan').select('principal_amount').eq('status', 'Pending'),
      ]);

      const sum = (arr: any[] | null) => (arr || []).reduce((s, r) => s + Number(r.amount || r.balance || r.principal_amount || r.emi_amount || 0), 0);

      setData({
        totalDeposits: sum(deposits.data),
        totalWithdrawals: sum(withdrawals.data),
        totalTransfers: sum(transfers.data),
        depositCount: (deposits.data || []).length,
        withdrawalCount: (withdrawals.data || []).length,
        transferCount: (transfers.data || []).length,
        totalBalanceInBank: sum(accounts.data),
        totalLoanDisbursed: sum(approvedLoans.data),
        totalEmiCollected: sum(paidEmi.data),
        pendingLoanAmount: sum(pendingLoans.data),
      });
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  if (loading) {
    return (
      <div className="animate-pulse max-w-7xl mx-auto">
        <div className="h-10 w-64 bg-card rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-card rounded-[32px]" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-card rounded-[40px]" />
          <div className="h-64 bg-card rounded-[40px]" />
        </div>
      </div>
    );
  }

  const netFlow = data.totalDeposits - data.totalWithdrawals;

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Financial Summary</h1>
        <p className="text-sm text-secondary mt-1">Bank-wide income, outcome, and balance analytics</p>
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 bg-accent-teal/10 -translate-y-1/2 translate-x-1/2" />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-accent-teal/10 text-accent-teal"><Wallet size={24} /></div>
          <div className="text-[13px] text-secondary font-medium tracking-wide uppercase mb-1">Total Bank Deposits</div>
          <div className="text-2xl font-semibold text-accent-teal font-mono tracking-wide">₹{fmt(data.totalBalanceInBank)}</div>
          <div className="text-[11px] text-secondary mt-2">Sum of all account balances</div>
        </div>

        <div className="bg-card rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 -translate-y-1/2 translate-x-1/2 ${netFlow >= 0 ? 'bg-accent-teal/10' : 'bg-accent-rose/10'}`} />
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${netFlow >= 0 ? 'bg-accent-teal/10 text-accent-teal' : 'bg-accent-rose/10 text-accent-rose'}`}>
            <TrendingUp size={24} />
          </div>
          <div className="text-[13px] text-secondary font-medium tracking-wide uppercase mb-1">Net Cash Flow</div>
          <div className={`text-2xl font-semibold font-mono tracking-wide ${netFlow >= 0 ? 'text-accent-teal' : 'text-accent-rose'}`}>
            {netFlow >= 0 ? '+' : ''}₹{fmt(netFlow)}
          </div>
          <div className="text-[11px] text-secondary mt-2">Deposits − Withdrawals</div>
        </div>

        <div className="bg-card rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 bg-primary/10 -translate-y-1/2 translate-x-1/2" />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-elevated text-primary"><PiggyBank size={24} /></div>
          <div className="text-[13px] text-secondary font-medium tracking-wide uppercase mb-1">Loans Disbursed</div>
          <div className="text-2xl font-semibold text-primary font-mono tracking-wide">₹{fmt(data.totalLoanDisbursed)}</div>
          <div className="text-[11px] text-secondary mt-2">Approved loans total</div>
        </div>

        <div className="bg-card rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 bg-accent-gold/10 -translate-y-1/2 translate-x-1/2" />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-accent-gold/10 text-accent-gold"><BadgeDollarSign size={24} /></div>
          <div className="text-[13px] text-secondary font-medium tracking-wide uppercase mb-1">EMI Collected</div>
          <div className="text-2xl font-semibold text-accent-gold font-mono tracking-wide">₹{fmt(data.totalEmiCollected)}</div>
          <div className="text-[11px] text-secondary mt-2">From paid installments</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Income Box */}
        <div className="bg-card rounded-[40px] p-8 shadow-sm">
          <h3 className="text-xl font-medium text-primary mb-6 flex items-center gap-2">
            <TrendingUp size={22} className="text-accent-teal" /> Income Breakdown
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-5 bg-accent-teal/5 border border-accent-teal/10 rounded-[24px]">
              <div>
                <div className="font-medium text-primary">Deposits</div>
                <div className="text-[12px] text-secondary mt-1">{data.depositCount} transactions</div>
              </div>
              <div className="font-semibold font-mono text-accent-teal text-lg tracking-wide">+₹{fmt(data.totalDeposits)}</div>
            </div>

            <div className="flex justify-between items-center p-5 bg-accent-teal/5 border border-accent-teal/10 rounded-[24px]">
              <div>
                <div className="font-medium text-primary">EMI Collections</div>
                <div className="text-[12px] text-secondary mt-1">From repayment schedules</div>
              </div>
              <div className="font-semibold font-mono text-accent-teal text-lg tracking-wide">+₹{fmt(data.totalEmiCollected)}</div>
            </div>

            <div className="my-6 h-px bg-app w-full" />
            
            <div className="flex justify-between items-center px-4">
              <span className="font-medium text-lg text-primary">Total Income</span>
              <span className="font-bold font-mono text-accent-teal text-2xl tracking-wide">
                ₹{fmt(data.totalDeposits + data.totalEmiCollected)}
              </span>
            </div>
          </div>
        </div>

        {/* Outcome Box */}
        <div className="bg-card rounded-[40px] p-8 shadow-sm">
          <h3 className="text-xl font-medium text-primary mb-6 flex items-center gap-2">
            <TrendingDown size={22} className="text-accent-rose" /> Outcome Breakdown
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-5 bg-accent-rose/5 border border-accent-rose/10 rounded-[24px]">
              <div>
                <div className="font-medium text-primary">Withdrawals</div>
                <div className="text-[12px] text-secondary mt-1">{data.withdrawalCount} transactions</div>
              </div>
              <div className="font-semibold font-mono text-accent-rose text-lg tracking-wide">-₹{fmt(data.totalWithdrawals)}</div>
            </div>

            <div className="flex justify-between items-center p-5 bg-accent-rose/5 border border-accent-rose/10 rounded-[24px]">
              <div>
                <div className="font-medium text-primary">Loans Disbursed</div>
                <div className="text-[12px] text-secondary mt-1">Approved loans principal</div>
              </div>
              <div className="font-semibold font-mono text-accent-rose text-lg tracking-wide">-₹{fmt(data.totalLoanDisbursed)}</div>
            </div>

            <div className="my-6 h-px bg-app w-full" />
            
            <div className="flex justify-between items-center px-4">
              <span className="font-medium text-lg text-primary">Total Outcome</span>
              <span className="font-bold font-mono text-accent-rose text-2xl tracking-wide">
                ₹{fmt(data.totalWithdrawals + data.totalLoanDisbursed)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Volume */}
      <div className="bg-card rounded-[40px] p-8 shadow-sm mb-12">
        <h3 className="text-xl font-medium text-primary mb-6 flex items-center gap-2">
          <ArrowLeftRight size={22} className="text-secondary" /> Network Volume
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-app border border-black/5 rounded-[24px] p-6 text-center">
            <div className="text-[13px] text-secondary uppercase tracking-wider mb-2">Total Transfer Volume</div>
            <div className="text-2xl font-bold font-mono tracking-wide text-primary">₹{fmt(data.totalTransfers)}</div>
          </div>
          
          <div className="bg-elevated rounded-[24px] p-6 text-center">
            <div className="text-[13px] text-secondary uppercase tracking-wider mb-2">Number of Transfers</div>
            <div className="text-2xl font-bold font-mono tracking-wide text-primary">{data.transferCount}</div>
          </div>
          
          <div className="bg-accent-gold/5 border border-accent-gold/10 rounded-[24px] p-6 text-center">
            <div className="text-[13px] text-secondary uppercase tracking-wider mb-2">Pending Loan Requests</div>
            <div className="text-2xl font-bold font-mono tracking-wide text-accent-gold">₹{fmt(data.pendingLoanAmount)}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
