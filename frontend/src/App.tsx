import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import AuthLayout from './components/layout/AuthLayout';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Beneficiaries from './pages/Beneficiaries';
import Loans from './pages/Loans';
import Accounts from './pages/Accounts';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/accounts" element={<Accounts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
