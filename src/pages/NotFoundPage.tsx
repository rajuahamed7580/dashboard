import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 mx-auto">
          <FileQuestion className="w-7 h-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Error 404</p>
          <h1 className="text-2xl font-extrabold text-white">Page Not Found</h1>
          <p className="text-sm text-slate-400">
            The admin route you requested does not exist or may have been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
