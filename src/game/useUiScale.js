import { useEffect, useState } from 'react'

/**
 * The whole interface is sized in rem, so changing the root font size scales
 * text, buttons, icons and spacing together. The teacher can bump it live
 * for a projector or shrink it for a small laptop screen.
 */
export const SCALE_STEPS = [16, 18, 20, 22, 24]
export const STANDARD_SCALE = 20
const STORAGE_KEY = 'fileops:ui-scale'
const STANDARD_KEY = 'fileops:ui-scale-standard'

const readStored = () => {
  if (typeof window === 'undefined') return STANDARD_SCALE
  let stored
  try {
    stored = Number(window.localStorage.getItem(STORAGE_KEY))
    // The standard changed since this browser last visited: the old default is
    // stale, so move to the new one. Later choices are kept as they are.
    if (window.localStorage.getItem(STANDARD_KEY) !== String(STANDARD_SCALE)) {
      window.localStorage.setItem(STANDARD_KEY, String(STANDARD_SCALE))
      window.localStorage.setItem(STORAGE_KEY, String(STANDARD_SCALE))
      return STANDARD_SCALE
    }
  } catch {
    /* private mode: fall through to the standard */
  }
  return SCALE_STEPS.includes(stored) ? stored : STANDARD_SCALE
}

export function useUiScale() {
  const [scale, setScale] = useState(readStored)

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale}px`
    try {
      window.localStorage.setItem(STORAGE_KEY, String(scale))
      window.localStorage.setItem(STANDARD_KEY, String(STANDARD_SCALE))
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
