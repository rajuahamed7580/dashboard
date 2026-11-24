import { Loader2 } from 'lucide-react';

interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export default function Loading({ label = 'Loading...', fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-400">{label}</p>
      </div>
    );
  }

  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="w-7 h-7 text-blue-500 animate-spin" aria-hidden="true" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
