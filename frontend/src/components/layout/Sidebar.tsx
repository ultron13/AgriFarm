import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';
import {
  ShoppingBasket, PackageCheck, Sprout, Wallet, ClipboardCheck,
  Truck, BarChart3, LogOut, Leaf, Users, LayoutDashboard, MessageCircle, Landmark, FileText, ShieldCheck, AlertTriangle, type LucideIcon,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  roles: string[];
}

const NAV: NavItem[] = [
  { to: '/dashboard',label: 'Dashboard',       Icon: LayoutDashboard, roles: ['FARMER'] },
  { to: '/browse',   label: 'Browse Produce',  Icon: ShoppingBasket,  roles: ['BUYER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/orders',   label: 'Orders',           Icon: PackageCheck,    roles: ['BUYER', 'FARMER', 'ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR'] },
  { to: '/listings', label: 'My Listings',      Icon: Sprout,          roles: ['FARMER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/payouts',  label: 'Payouts',           Icon: Wallet,          roles: ['FARMER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/sales',    label: 'My Farmers',       Icon: Users,           roles: ['SALES_REP', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/quality',  label: 'Quality Checks',  Icon: ClipboardCheck,  roles: ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/logistics',label: 'Logistics',        Icon: Truck,           roles: ['LOGISTICS_COORDINATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/reports',  label: 'Reports',          Icon: BarChart3,       roles: ['ADMIN', 'SUPER_ADMIN'] },
  { to: '/whatsapp', label: 'WhatsApp Orders',  Icon: MessageCircle,   roles: ['SALES_REP', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/gov',      label: 'Procurement Portal', Icon: Landmark,      roles: ['GOV_BUYER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/tenders',    label: 'Gov Tenders',      Icon: FileText,    roles: ['FARMER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/compliance', label: 'Compliance Vault', Icon: ShieldCheck, roles: ['FARMER'] },
  { to: '/compliance/verify', label: 'Verify Docs', Icon: ShieldCheck, roles: ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/disputes', label: 'Disputes', Icon: AlertTriangle, roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const visibleNav = NAV.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Leaf size={16} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">FarmConnect</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-none">South Africa</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-brand-700">
              {user?.role?.[0] ?? 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
