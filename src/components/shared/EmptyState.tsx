import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="py-14 px-6 text-center flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center text-slate-400">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
