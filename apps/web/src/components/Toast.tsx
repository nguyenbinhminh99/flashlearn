import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error';

interface ToastProps {
  readonly variant: ToastVariant;
  readonly message: string;
  readonly onClose: () => void;
}

export function Toast({ variant, message, onClose }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const success = variant === 'success';

  useEffect(() => {
    if (hovered || focused) return;
    const timeout = window.setTimeout(onClose, success ? 5000 : 7000);
    return () => window.clearTimeout(timeout);
  }, [hovered, focused, success, onClose]);

  return (
    <div
      role={success ? 'status' : 'alert'}
      aria-atomic="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      className={`toast pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${
        success ? 'border-teal-200' : 'border-red-200'
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          success ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-600'
        }`}
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {success ? <path d="m5 12 4 4L19 6" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" /></>}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${success ? 'text-teal-800' : 'text-red-700'}`}>
          {success ? 'Thành công' : 'Thất bại'}
        </p>
        <p className="mt-1 text-sm text-slate-600 [overflow-wrap:anywhere]">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={onClose}
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
