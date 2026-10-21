export function Tip({ label, hint, children, align = 'center' }) {
  const alignClass =
    align === 'left' ? 'left-0 translate-x-0' : align === 'right' ? 'right-0 translate-x-0' : 'left-1/2 -translate-x-1/2'
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-2 hidden ${alignClass} animate-float-in rounded-lg border border-ink-600 bg-ink-950/95 px-2.5 py-1.5 text-[11px] leading-snug text-slate-200 shadow-2xl shadow-black/50 group-hover/tip:block`}
      >
        <span className="font-semibold text-white">{label}</span>
        {hint ? <span className="ml-1.5 text-slate-400">{hint}</span> : null}
      </span>
    </span>
  )
}

export function TipIcon({ label, hint, children }) {
  return (
    <Tip label={label} hint={hint}>
      {children}
    </Tip>
  )
}
