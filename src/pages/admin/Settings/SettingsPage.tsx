import React, { useState } from 'react';
import { Save, Server, Globe, Sliders } from 'lucide-react';
import { API_BASE_URL, WEBSITE_BASE_URL } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';

const SETTINGS_STORAGE_KEY = 'pd_admin_settings';

interface AdminPreferences {
  defaultPageSize: number;
  compactSidebarByDefault: boolean;
  confirmBeforeApprove: boolean;
}

function loadPreferences(): AdminPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminPreferences;
  } catch {
    // ignore malformed storage
  }
  return {
    defaultPageSize: 10,
    compactSidebarByDefault: localStorage.getItem('pd_admin_sidebar_collapsed') === 'true',
    confirmBeforeApprove: false
  };
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<AdminPreferences>(loadPreferences);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
    localStorage.setItem('pd_admin_sidebar_collapsed', String(prefs.compactSidebarByDefault));
    showToast('Dashboard preferences saved.');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard Settings</h2>
        <p className="text-sm text-slate-400">
          Manage workspace preferences and review connected environment endpoints
        </p>
      </div>

      {/* Connected Services */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          Environment & Sync Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Backend API Endpoint
            </div>
            <p className="text-xs font-mono text-blue-400 break-all">{API_BASE_URL}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Globe className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
              Public Website URL
            </div>
            <p className="text-xs font-mono text-slate-300 break-all">{WEBSITE_BASE_URL}</p>
          </div>
        </div>
      </section>

      {/* Preferences Form */}
      <form
        onSubmit={handleSave}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
      >
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" aria-hidden="true" />
          Interface Preferences
        </h3>

        <div>
          <label htmlFor="page-size" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Default Table Page Size
          </label>
          <select
            id="page-size"
            value={prefs.defaultPageSize}
            onChange={(e) => setPrefs({ ...prefs, defaultPageSize: Number(e.target.value) })}
            className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value={10}>10 rows per page</option>
            <option value={20}>20 rows per page</option>
            <option value={50}>50 rows per page</option>
          </select>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.compactSidebarByDefault}
            onChange={(e) => setPrefs({ ...prefs, compactSidebarByDefault: e.target.checked })}
            className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <span className="block text-sm font-medium text-slate-200">
              Collapse sidebar by default on desktop
            </span>
            <span className="block text-xs text-slate-400">
              Maximizes horizontal space for wide data tables and post forms.
            </span>
          </span>
        </label>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
