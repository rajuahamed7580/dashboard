import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { SEGMENT_LABELS } from './routeMeta';

export default function Breadcrumb() {
  const location = useLocation();
  const rawSegments = location.pathname.split('/').filter(Boolean);

  // Skip leading "admin" in visible trail because Home links to /admin/dashboard
  const segments = rawSegments[0] === 'admin' ? rawSegments.slice(1) : rawSegments;

  const crumbs = segments.map((seg, idx) => {
    const path = `/admin/${segments.slice(0, idx + 1).join('/')}`;
    const prev = idx > 0 ? segments[idx - 1] : '';

    let label = SEGMENT_LABELS[seg];
    if (!label) {
      if (prev === 'users') label = 'User Details';
      else if (prev === 'posts') label = 'Post Details';
      else if (prev === 'comments') label = 'Comment Details';
      else label = seg;
    }

    return { label, path, isLast: idx === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-400">
      <ol className="flex items-center flex-wrap gap-1.5">
        <li>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1 hover:text-white transition-colors"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Admin</span>
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="inline-flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            {crumb.isLast ? (
              <span aria-current="page" className="font-medium text-slate-200">
                {crumb.label}
              </span>
            ) : (
              <Link to={crumb.path} className="hover:text-white transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
