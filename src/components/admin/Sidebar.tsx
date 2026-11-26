import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Sparkles,
  Link2,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavGroup {
  label: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [{ to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard }]
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/posts', label: 'Posts', icon: FileText },
      { to: '/admin/comments', label: 'Comments', icon: MessageSquare }
    ]
  },
  {
    label: 'Content Management',
    items: [
      { to: '/admin/comment-generator', label: 'Comment Generator', icon: Sparkles },
      { to: '/admin/custom-urls', label: 'Custom URLs', icon: Link2 }
    ]
  },
  {
    label: 'Account',
    items: [
      { to: '/admin/profile', label: 'Profile', icon: UserCircle },
      { to: '/admin/settings', label: 'Settings', icon: Settings }
    ]
  }
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const initials = (user?.name || 'Admin')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (isMobile: boolean) => {
    const isCompact = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <Link
            to="/admin/dashboard"
            onClick={isMobile ? onCloseMobile : undefined}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            {!isCompact && (
              <div className="truncate">
                <span className="text-lg font-black tracking-tight text-white">
                  Private<span className="text-blue-500">Delights</span>
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 leading-none">
                  Admin Panel
                </p>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCompact && (
                <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={isMobile ? onCloseMobile : undefined}
                    title={isCompact ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isCompact ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-950/50'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    {!isCompact && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Admin Profile & Logout Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 flex-shrink-0">
          <Link
            to="/admin/profile"
            onClick={isMobile ? onCloseMobile : undefined}
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/80 transition-colors ${
              isCompact ? 'justify-center' : ''
            }`}
            title={isCompact ? user?.name || 'Admin Profile' : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            {!isCompact && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {user?.name || 'Super Admin'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={logout}
            title={isCompact ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600/80 border border-rose-900/50 transition-colors ${
              isCompact ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {!isCompact && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed/Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen transition-[width] duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
