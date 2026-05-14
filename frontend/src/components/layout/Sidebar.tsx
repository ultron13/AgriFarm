import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
}

const NAV: NavItem[] = [
  { to: '/browse', label: 'Browse Produce', icon: '🥬', roles: ['BUYER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/orders', label: 'Orders', icon: '📦', roles: ['BUYER', 'FARMER', 'ADMIN', 'SUPER_ADMIN', 'LOGISTICS_COORDINATOR'] },
  { to: '/listings', label: 'My Listings', icon: '🌱', roles: ['FARMER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/payouts', label: 'Payouts', icon: '💳', roles: ['FARMER', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/quality', label: 'Quality Checks', icon: '✅', roles: ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/logistics', label: 'Logistics', icon: '🚛', roles: ['LOGISTICS_COORDINATOR', 'ADMIN', 'SUPER_ADMIN'] },
  { to: '/reports', label: 'Reports', icon: '📊', roles: ['ADMIN', 'SUPER_ADMIN'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const visibleNav = NAV.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100">
        <span className="text-xl font-bold text-brand-700">FarmConnect</span>
        <span className="text-xs text-gray-400 block">SA</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1 truncate">{user?.role}</p>
        <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}
