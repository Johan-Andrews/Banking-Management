import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';

export default function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(300);
      if (filterEvent) query = query.eq('event_type', filterEvent);
      const { data } = await query;
      if (data) setLogs(data);
      setLoading(false);
    }
    load();
  }, [filterEvent]);

  const filtered = logs.filter(l =>
    (l.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.event_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eventBgClass = (type: string) => {
    if (type.includes('SUCCESS')) return 'bg-accent-teal/10 text-accent-teal';
    if (type.includes('FAILED') || type.includes('LOCKED')) return 'bg-accent-rose/10 text-accent-rose';
    if (type.includes('LOGOUT')) return 'bg-accent-gold/10 text-accent-gold';
    return 'bg-app text-secondary border border-black/5';
  };

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-normal tracking-wide uppercase text-primary">Audit Logs</h1>
          <p className="text-sm text-secondary mt-1">Complete login/logout event trail with IP tracking (REQ-4B)</p>
        </div>
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-secondary/10 text-secondary tracking-wide shadow-sm">
          {logs.length} entries
        </span>
      </div>

      <div className="bg-card rounded-[40px] p-6 md:p-10 shadow-sm min-h-[500px]">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-lg">
            <Search size={18} className="absolute top-1/2 left-5 -translate-y-1/2 text-secondary" />
            <input type="text" className="w-full bg-app text-primary rounded-full pl-12 pr-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all shadow-sm" placeholder="Search by username or event..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          <select className="bg-app text-primary rounded-full px-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 appearance-none shadow-sm border border-transparent min-w-[180px]" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
            <option value="">All Events</option>
            <option value="LOGIN_SUCCESS">Login Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="ACCOUNT_LOCKED">Account Locked</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-app rounded-2xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app">
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-2">Timestamp</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-4">Username</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-4">Event Type</th>
                  <th className="pb-4 text-[11px] tracking-wider uppercase font-semibold text-secondary px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {filtered.map(log => (
                  <tr key={log.log_id} className="hover:bg-app/30 transition-colors">
                    <td className="py-3 px-2 text-[13px] text-secondary whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-[14px] text-primary">
                      {log.username || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${eventBgClass(log.event_type)}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tracking-widest text-[#81727E] text-[12px]">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-secondary py-16">
                      {searchTerm ? 'No audit logs match criteria.' : 'No audit logs found.'}
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
