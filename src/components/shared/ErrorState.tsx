import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry
}: ErrorStateProps) {
  return (
    <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-6 text-center flex flex-col items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-sm font-semibold text-rose-200">{title}</h3>
        <p className="text-xs text-rose-300/80">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-100 text-xs font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Try Again
        </button>
      )}
    </div>
  );
}
