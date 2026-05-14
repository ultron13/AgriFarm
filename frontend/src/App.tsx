import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { BrowsePage } from '@/pages/buyer/BrowsePage';
import { BuyerOrdersPage } from '@/pages/buyer/OrdersPage';
import { FarmerOrdersPage } from '@/pages/farmer/OrdersPage';
import { FarmerDashboardPage } from '@/pages/farmer/DashboardPage';
import { FarmerListingsPage } from '@/pages/farmer/ListingsPage';
import { FarmerPayoutsPage } from '@/pages/farmer/PayoutsPage';
import { AdminOrdersPage } from '@/pages/admin/OrdersPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { QualityCheckPage } from '@/pages/field-agent/QualityCheckPage';
import { LogisticsPage } from '@/pages/logistics/LogisticsPage';
import { SalesRepPage } from '@/pages/sales/SalesRepPage';
import { WhatsAppSimulatorPage } from '@/pages/sales/WhatsAppSimulatorPage';

const ROLE_HOME: Record<string, string> = {
  FARMER: '/dashboard', BUYER: '/browse', FIELD_AGENT: '/quality',
  LOGISTICS_COORDINATOR: '/logistics', SALES_REP: '/sales',
  ADMIN: '/orders', SUPER_ADMIN: '/orders',
};

function OrdersPage() {
  const { user } = useAuth();
  if (user?.role === 'FARMER') return <FarmerOrdersPage />;
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') return <AdminOrdersPage />;
  return <BuyerOrdersPage />;
}

function DefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] ?? '/browse'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppShell />}>
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/dashboard" element={<FarmerDashboardPage />} />
        <Route path="/listings" element={<FarmerListingsPage />} />
        <Route path="/payouts" element={<FarmerPayoutsPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/quality" element={<QualityCheckPage />} />
        <Route path="/logistics" element={<LogisticsPage />} />
        <Route path="/sales" element={<SalesRepPage />} />
        <Route path="/whatsapp" element={<WhatsAppSimulatorPage />} />
        <Route path="/" element={<DefaultRedirect />} />
      </Route>
    </Routes>
  );
}
