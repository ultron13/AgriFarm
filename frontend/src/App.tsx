import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { BrowsePage } from '@/pages/buyer/BrowsePage';
import { BuyerOrdersPage } from '@/pages/buyer/OrdersPage';
import { FarmerDashboardPage } from '@/pages/farmer/DashboardPage';
import { FarmerListingsPage } from '@/pages/farmer/ListingsPage';
import { FarmerPayoutsPage } from '@/pages/farmer/PayoutsPage';
import { AdminOrdersPage } from '@/pages/admin/OrdersPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { QualityCheckPage } from '@/pages/field-agent/QualityCheckPage';
import { LogisticsPage } from '@/pages/logistics/LogisticsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppShell />}>
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/orders" element={<BuyerOrdersPage />} />
        <Route path="/dashboard" element={<FarmerDashboardPage />} />
        <Route path="/listings" element={<FarmerListingsPage />} />
        <Route path="/payouts" element={<FarmerPayoutsPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/quality" element={<QualityCheckPage />} />
        <Route path="/logistics" element={<LogisticsPage />} />
        <Route path="/" element={<Navigate to="/browse" replace />} />
      </Route>
    </Routes>
  );
}
