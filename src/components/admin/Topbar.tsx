import { Link } from 'react-router-dom';
import { Menu, ExternalLink, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WEBSITE_BASE_URL } from '../../services/apiClient';
import Breadcrumb from './Breadcrumb';

interface TopbarProps {
  pageTitle: string;
  onOpenMobileMenu: () => void;
}

export default function Topbar({ pageTitle, onOpenMobileMenu }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white truncate leading-tight">
              {pageTitle}
            </h1>
            <Breadcrumb />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {WEBSITE_BASE_URL && (
            <a
              href={WEBSITE_BASE_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <span>Open Website</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}

          <Link
            to="/admin/profile"
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <UserCircle className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold text-slate-200">{user?.name || 'Admin'}</div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
