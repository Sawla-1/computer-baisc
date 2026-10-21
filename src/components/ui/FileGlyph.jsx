export const KIND_STYLE = {
  folder: { bg: 'from-amber-400/30 to-amber-500/10', ring: 'ring-amber-400/40', text: 'text-amber-200', label: 'F' },
  text: { bg: 'from-slate-300/25 to-slate-500/10', ring: 'ring-slate-300/30', text: 'text-slate-200', label: 'TXT' },
  doc: { bg: 'from-blue-500/30 to-blue-700/10', ring: 'ring-blue-400/40', text: 'text-blue-200', label: 'DOC' },
  pdf: { bg: 'from-rose-500/30 to-rose-700/10', ring: 'ring-rose-400/40', text: 'text-rose-200', label: 'PDF' },
  sheet: { bg: 'from-emerald-500/30 to-emerald-700/10', ring: 'ring-emerald-400/40', text: 'text-emerald-200', label: 'XLS' },
  slides: { bg: 'from-orange-500/30 to-orange-700/10', ring: 'ring-orange-400/40', text: 'text-orange-200', label: 'PPT' },
  image: { bg: 'from-fuchsia-500/30 to-purple-700/10', ring: 'ring-fuchsia-400/40', text: 'text-fuchsia-200', label: 'IMG' },
  audio: { bg: 'from-teal-500/30 to-teal-700/10', ring: 'ring-teal-400/40', text: 'text-teal-200', label: 'MP3' },
  video: { bg: 'from-violet-500/30 to-violet-700/10', ring: 'ring-violet-400/40', text: 'text-violet-200', label: 'MP4' },
  archive: { bg: 'from-yellow-600/30 to-yellow-800/10', ring: 'ring-yellow-400/40', text: 'text-yellow-200', label: 'ZIP' },
  app: { bg: 'from-red-500/30 to-red-700/10', ring: 'ring-red-400/40', text: 'text-red-200', label: 'EXE' },
  code: { bg: 'from-cyan-500/30 to-cyan-700/10', ring: 'ring-cyan-400/40', text: 'text-cyan-200', label: 'DEV' },
  file: { bg: 'from-slate-500/25 to-slate-700/10', ring: 'ring-slate-400/30', text: 'text-slate-300', label: 'FILE' },
}

export function FolderGlyph({ className = 'h-11 w-11' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="folderFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path
        d="M4 12a4 4 0 0 1 4-4h11.2a4 4 0 0 1 2.9 1.2L26 13h14a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V12Z"
        fill="url(#folderFill)"
      />
      <path
        d="M4 18a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v3H4v-3Z"
        fill="#fcd34d"
        fillOpacity="0.55"
      />
    </svg>
  )
}

export function FileGlyph({ kind, ext, className = 'h-11 w-11' }) {
  const style = KIND_STYLE[kind] || KIND_STYLE.file
  const label = (ext || style.label).toUpperCase().slice(0, 3)
  return (
    <div
      className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-gradient-to-br ${style.bg} ring-1 ${style.ring} ${style.text}`}
    >
      <span className="text-[0.625rem] font-bold leading-none tracking-tight">{label}</span>
    </div>
  )
}
