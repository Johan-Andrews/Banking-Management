import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, UserCheck, UserX } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('customer').select('*').order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from('customer').update({ is_active: !currentStatus }).eq('customer_id', id);
    loadData();
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact_number.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Customer Management</h1>
          <p className="text-sm text-secondary mt-1">View and manage all registered customers (REQ-4C)</p>
        </div>
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-accent-teal/10 text-accent-teal tracking-wide shadow-sm">
          {customers.length} customers
        </span>
      </div>

      <div className="bg-card rounded-[40px] p-6 md:p-10 shadow-sm min-h-[500px]">
        {/* Toolbar */}
        <div className="flex mb-8">
          <div className="relative flex-1 max-w-lg">
            <Search size={18} className="absolute top-1/2 left-5 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              className="w-full bg-app text-primary rounded-full pl-12 pr-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all shadow-sm"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
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
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Name</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Email</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Phone</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Gender</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">DOB</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Gov ID</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Status</th>
                  <th className="pb-4 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {filtered.map(c => (
                  <tr key={c.customer_id} className="hover:bg-app/30 transition-colors">
                    <td className="py-4 px-2 font-medium text-[14px] text-primary whitespace-nowrap">{c.name}</td>
                    <td className="py-4 px-2 text-[14px] text-secondary">{c.email}</td>
                    <td className="py-4 px-2 text-[13px] font-mono tracking-wide text-primary">{c.contact_number}</td>
                    <td className="py-4 px-2 text-[14px] text-secondary">{c.gender || '—'}</td>
                    <td className="py-4 px-2 text-[13px] text-secondary whitespace-nowrap">{c.date_of_birth}</td>
                    <td className="py-4 px-2 text-[13px] font-mono tracking-wide text-primary whitespace-nowrap">{c.government_id}</td>
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${c.is_active ? 'bg-accent-teal/10 text-accent-teal' : 'bg-accent-rose/10 text-accent-rose'}`}>
                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${c.is_active ? 'text-accent-rose hover:bg-accent-rose/10' : 'text-accent-teal hover:bg-accent-teal/10'}`}
                        onClick={() => toggleActive(c.customer_id, c.is_active)}
                      >
                        {c.is_active ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-secondary py-16">
                      {searchTerm ? 'No customers match your search.' : 'No customers found.'}
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
