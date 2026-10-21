import { useUiScale } from '../../game/useUiScale.js'

/**
 * Floating text-size control. Lives on every screen so the size can be
 * changed mid-lesson without leaving the exercise.
 */
export function ScaleControl() {
  const { scale, smaller, bigger, canSmaller, canBigger } = useUiScale()

  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/85 px-1.5 py-1 shadow-xl backdrop-blur-md">
      <button
        type="button"
        onClick={smaller}
        disabled={!canSmaller}
        aria-label="Make the text smaller"
        className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        <span className="text-[0.8125rem] font-bold">A−</span>
      </button>
      <span
        className="px-1 text-[0.625rem] font-semibold tabular-nums text-slate-500"
        title="Current interface size"
      >
        {scale}
      </span>
      <button
        type="button"
        onClick={bigger}
        disabled={!canBigger}
        aria-label="Make the text bigger"
        className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        <span className="text-[0.9375rem] font-bold">A+</span>
      </button>
    </div>
  )
}
