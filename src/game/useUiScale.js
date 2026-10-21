import { useEffect, useState } from 'react'

/**
 * The whole interface is sized in rem, so changing the root font size scales
 * text, buttons, icons and spacing together. The teacher can bump it live
 * for a projector or shrink it for a small laptop screen.
 */
export const SCALE_STEPS = [16, 18, 20, 22]
const STORAGE_KEY = 'fileops:ui-scale'

const readStored = () => {
  if (typeof window === 'undefined') return 18
  const saved = Number(window.localStorage.getItem(STORAGE_KEY))
  return SCALE_STEPS.includes(saved) ? saved : 18
}

export function useUiScale() {
  const [scale, setScale] = useState(readStored)

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}px`
    try {
      window.localStorage.setItem(STORAGE_KEY, String(scale))
    } catch {
      /* private mode: keep the in-memory value only */
    }
  }, [scale])

  const index = SCALE_STEPS.indexOf(scale)
  return {
    scale,
    setScale,
    smaller: () => setScale(SCALE_STEPS[Math.max(0, index - 1)]),
    bigger: () => setScale(SCALE_STEPS[Math.min(SCALE_STEPS.length - 1, index + 1)]),
    canSmaller: index > 0,
    canBigger: index < SCALE_STEPS.length - 1,
  }
}
