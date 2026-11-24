import { useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ToastContainer() {
  const { toasts, dismissToast, pauseToast, resumeToast, liveAnnouncement } = useToast();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = popoverRef.current as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el || typeof el.showPopover !== 'function') return;

    try {
      if (toasts.length > 0 && !el.matches(':popover-open')) {
        el.showPopover();
      } else if (toasts.length === 0 && el.matches(':popover-open')) {
        el.hidePopover();
      }
    } catch {
      // Ignore if popover state transition is not supported in current browser
    }
  }, [toasts.length]);

  return (
    <>
      <p className="inclusively-hidden">Notifications</p>
      <div aria-live="polite" aria-atomic="true" className="inclusively-hidden">
        {liveAnnouncement}
      </div>

      <div
        ref={popoverRef}
        role="region"
        aria-label="Notifications"
        {...({ popover: 'manual' } as Record<string, string>)}
        className="toast-popover z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none"
      >
        {toasts.map((toast) => {
          const styles =
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-700 text-rose-100'
              : toast.type === 'info'
              ? 'bg-blue-950/95 border-blue-700 text-blue-100'
              : 'bg-emerald-950/95 border-emerald-700 text-emerald-100';

          const Icon =
            toast.type === 'error'
              ? AlertCircle
              : toast.type === 'info'
              ? Info
              : CheckCircle2;

          return (
            <div
              key={toast.id}
              onMouseEnter={() => pauseToast(toast.id)}
              onMouseLeave={() => resumeToast(toast.id)}
              onFocus={() => pauseToast(toast.id)}
              onBlur={() => resumeToast(toast.id)}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${styles}`}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">{toast.text}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
