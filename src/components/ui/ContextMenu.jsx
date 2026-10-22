import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'

export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8
    if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8
    setPos((prev) =>
      prev.left === left && prev.top === top ? prev : { left: Math.max(8, left), top: Math.max(8, top) },
    )
  }, [x, y])

  useEffect(() => {
    const close = () => onClose()
    const key = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', key)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', key)
      window.removeEventListener('resize', close)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{ left: pos.left, top: pos.top }}
      className="fixed z-[70] w-52 overflow-hidden rounded-xl border border-white/10 bg-ink-900/97 p-1 shadow-2xl shadow-black/60 backdrop-blur-md animate-float-in"
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="my-1 h-px bg-white/10" />
        ) : (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              item.onClick?.()
              onClose()
            }}
            className={`focus-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-base transition disabled:opacity-35 ${
              item.danger
                ? 'text-rose-300 hover:bg-rose-500/15'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            {item.icon ? <Icon name={item.icon} className="h-4 w-4 opacity-80" /> : null}
            <span className="flex-1">{item.label}</span>
            {item.hint ? <span className="text-sm text-slate-500">{item.hint}</span> : null}
          </button>
        ),
      )}
    </div>
  )
}
