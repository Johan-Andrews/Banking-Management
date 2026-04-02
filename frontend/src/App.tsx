import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// NFR 7.1 Performance: Route-level code splitting via React.lazy()
// Each page is loaded as a separate JS chunk to reduce initial bundle size.
const Login        = lazy(() => import('./pages/Login'));
const Register     = lazy(() => import('./pages/Register'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Transfer     = lazy(() => import('./pages/Transfer'));
const Beneficiaries = lazy(() => import('./pages/Beneficiaries'));
const Loans        = lazy(() => import('./pages/Loans'));
const Accounts     = lazy(() => import('./pages/Accounts'));

const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBranches    = lazy(() => import('./pages/admin/AdminBranches'));
const AdminCustomers   = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminEmployees   = lazy(() => import('./pages/admin/AdminEmployees'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminAccounts    = lazy(() => import('./pages/admin/AdminAccounts'));
const AdminLoans       = lazy(() => import('./pages/admin/AdminLoans'));
const AdminAudit       = lazy(() => import('./pages/admin/AdminAudit'));
const AdminFinancials  = lazy(() => import('./pages/admin/AdminFinancials'));

// Layout components — kept eagerly loaded since they wrap routes
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout      from './components/layout/AuthLayout';
import AdminLayout     from './components/layout/AdminLayout';

// Minimal full-screen loader shown during lazy chunk fetch
function PageLoader() {
  return (
    <div className="min-h-screen bg-shell flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
        <p className="text-secondary text-sm">Loading…</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Customer Portal */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/transfer"     element={<Transfer />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/loans"        element={<Loans />} />
            <Route path="/accounts"     element={<Accounts />} />
          </Route>

          {/* Admin Portal */}
          <Route element={<AdminLayout />}>
            <Route path="/admin"               element={<AdminDashboard />} />
            <Route path="/admin/branches"      element={<AdminBranches />} />
            <Route path="/admin/customers"     element={<AdminCustomers />} />
            <Route path="/admin/employees"     element={<AdminEmployees />} />
            <Route path="/admin/transactions"  element={<AdminTransactions />} />
            <Route path="/admin/accounts"      element={<AdminAccounts />} />
            <Route path="/admin/loans"         element={<AdminLoans />} />
            <Route path="/admin/audit"         element={<AdminAudit />} />
            <Route path="/admin/financials"    element={<AdminFinancials />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
