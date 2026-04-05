import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, UserCog, ArrowLeftRight, CreditCard,
  FileText, ScrollText, DollarSign, LogOut, Shield, Building, Eye
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'staff')) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  const isAdmin   = user.role === 'admin';
  const isManager = user.role === 'manager';
  const isStaff   = user.role === 'staff';

  // Role-based sidebar definition
  // adminOnly  → visible only to admin
  // managerOnly → visible to admin + manager (not staff)
  const allMenuItems = [
    { name: 'Dashboard',     icon: LayoutDashboard, path: '/admin' },
    { name: 'Branches',      icon: Building,        path: '/admin/branches',     managerOnly: true },
    { name: 'Customers',     icon: Users,           path: '/admin/customers' },
    { name: 'Employees',     icon: UserCog,         path: '/admin/employees',    managerOnly: true },
    { name: 'Accounts',      icon: CreditCard,      path: '/admin/accounts' },
    { name: 'Transactions',  icon: ArrowLeftRight,  path: '/admin/transactions' },
    { name: 'Loans',         icon: FileText,        path: '/admin/loans' },
    { name: 'Audit Logs',    icon: ScrollText,      path: '/admin/audit',        adminOnly: true },
    { name: 'Financials',    icon: DollarSign,      path: '/admin/financials',   adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly)   return isAdmin;
    if (item.managerOnly) return isAdmin || isManager;
    return true; // visible to all (admin + manager + staff)
  });

  // Panel label shown in the sidebar header
  const panelLabel =
    isAdmin   ? 'Admin Panel'   :
    isManager ? 'Manager Panel' :
                'Staff Panel';

  // Role badge colour
  const roleBadgeClass =
    isAdmin   ? 'bg-accent-rose/10 text-accent-rose'   :
    isManager ? 'bg-accent-teal/10 text-accent-teal'   :
                'bg-accent-gold/10 text-accent-gold';

  return (
    <div className="bg-shell min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="bg-app rounded-[40px] w-full max-w-[1400px] min-h-[85vh] overflow-hidden shadow-2xl transition-all duration-300 flex relative">
        {/* Sidebar */}
        <aside className="w-[260px] p-8 shrink-0 flex flex-col border-r border-[#e6dce3]/50 hidden md:flex">
          {/* Brand */}
          <div className="mb-8 px-2">
            <h1 className="text-[28px] font-semibold text-primary tracking-wide uppercase flex items-center gap-2">
              <Shield size={28} className="text-secondary" />
              AeroBank
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm font-medium text-secondary">{panelLabel}</p>
              {isStaff && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${roleBadgeClass}`}>
                  <Eye size={10} /> Read-Only
                </span>
              )}
            </div>
          </div>

          {/* Staff read-only notice */}
          {isStaff && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[12px] leading-relaxed">
              <strong>Staff Access:</strong> You can view branch data but cannot perform administrative actions.
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2">
            {menuItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  to={item.path}
                  key={item.name}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive 
                      ? 'bg-elevated text-primary shadow-sm font-medium' 
                      : 'text-secondary hover:text-primary hover:bg-[#e6dce3]/50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-[15px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-secondary hover:text-accent-rose hover:bg-accent-rose/10 transition-colors mt-4 text-left"
          >
            <LogOut size={20} />
            <span className="text-[15px] font-medium">Log Out</span>
          </button>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-app border-t border-card/60 flex flex-wrap justify-around p-2 z-[100]">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link to={item.path} key={item.name} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${isActive ? 'text-primary bg-elevated shadow-sm' : 'text-secondary'}`}>
                <item.icon size={18} />
                <span className="text-[10px] font-medium">{item.name.substring(0, 8)}</span>
              </Link>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full pb-28 md:pb-10 relative bg-app">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
