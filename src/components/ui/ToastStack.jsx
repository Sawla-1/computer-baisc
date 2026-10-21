import { useEffect } from 'react'

const TONE = {
  good: { ring: 'ring-neon-400/60', bg: 'bg-neon-500/15', icon: '✓', text: 'text-neon-400' },
  bad: { ring: 'ring-rose-400/60', bg: 'bg-rose-500/15', icon: '!', text: 'text-rose-300' },
  hint: { ring: 'ring-mango-400/60', bg: 'bg-amber-500/15', icon: '?', text: 'text-amber-300' },
  info: { ring: 'ring-grape-400/60', bg: 'bg-grape-500/15', icon: 'i', text: 'text-grape-300' },
}

function Toast({ toast, onDismiss }) {
  const tone = TONE[toast.type] || TONE.info
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 3800)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])
  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-xl border border-white/5 ${tone.bg} p-3 shadow-2xl shadow-black/40 ring-1 ${tone.ring} animate-slide-up backdrop-blur-md`}
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/30 text-sm font-bold ${tone.text}`}
      >
        {tone.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-white">{toast.title}</p>
        {toast.body ? <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{toast.body}</p> : null}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="focus-ring rounded p-1 text-slate-400 transition hover:text-white"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
