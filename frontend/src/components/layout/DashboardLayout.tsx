import { ReactNode } from 'react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Send, Users, LogOut, FileText, CreditCard } from 'lucide-react';

export default function DashboardLayout() {
  const { customerId, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!customerId) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Open Account', icon: CreditCard, path: '/accounts' },
    { name: 'Transfers', icon: Send, path: '/transfer' },
    { name: 'Beneficiaries', icon: Users, path: '/beneficiaries' },
    { name: 'Loans', icon: FileText, path: '/loans' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div style={{ padding: '0 0 24px 0', borderBottom: '1px solid var(--border-light)' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700 }}>AeroBank</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Premium Banking</p>
        </div>

        <nav style={{ flex: 1, marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                to={item.path} 
                key={item.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: 'var(--radius-button)', textDecoration: 'none',
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <item.icon size={20} style={{ color: isActive ? 'var(--accent-blue)' : 'inherit' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
