import { useEffect, useState } from 'react'
import { Icon } from '../ui/Icon.jsx'

export function Coach({ coach, hint, level, onShowMe, onNextHint, nextHintLabel }) {
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    setDismissed(false)
  }, [coach])

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="focus-ring fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/90 px-3 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur transition hover:border-neon-400/50"
      >
        <Icon name="spark" className="h-4 w-4 text-mango-400" />
        Show the coach
      </button>
    )
  }

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-mango-400/30 bg-ink-900/95 p-3.5 shadow-2xl shadow-black/50 backdrop-blur-md animate-slide-up">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mango-400/15 text-mango-400">
          <Icon name="spark" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mango-400/80">
            Coach
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-100">{coach}</p>
          {hint ? (
            <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs leading-relaxed text-slate-300 animate-float-in">
              {hint}
            </p>
          ) : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {level < 2 ? (
              <button
                type="button"
                onClick={onNextHint}
                className="focus-ring rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-mango-400/50 hover:text-white"
              >
                {nextHintLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onShowMe}
                className="focus-ring rounded-lg border border-neon-400/50 bg-neon-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-neon-300 transition hover:bg-neon-500/25"
              >
                Show me where
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="focus-ring rounded-lg px-2 py-1.5 text-[11px] text-slate-500 transition hover:text-slate-300"
            >
              Hide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
