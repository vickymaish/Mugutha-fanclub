import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Send,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';

const NAV = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/fixtures', label: 'Fixtures', icon: Calendar },
  { path: '/broadcasts', label: 'Broadcasts', icon: Send },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-[#1a237e] text-white p-4 flex flex-col min-h-screen">
      <div className="brand mb-8">
        <h1 className="text-2xl font-bold">Mugutha FC</h1>
        <p className="text-sm opacity-80">#MoreThanFootball</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                active ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/20 pt-4 mt-auto">
        <div className="text-sm opacity-80">Club Owner</div>
        <div className="text-xs opacity-60">Njagi</div>
      </div>
    </aside>
  );
}
