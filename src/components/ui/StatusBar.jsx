export function StatusBar({ items, selection, path, inTrash, selectedNodes }) {
  const size = selectedNodes?.reduce((sum, n) => sum + (n.size || 0), 0) || 0
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 bg-ink-850/60 px-4 py-1.5 text-[0.6875rem] text-slate-400">
      <span>
        {items} item{items === 1 ? '' : 's'}
        {inTrash ? ' in the Recycle Bin' : ''}
      </span>
      <span>
        {selection} selected
        {size ? ` ยท ${(size / 1024).toFixed(1)} KB` : ''}
      </span>
      <span className="ml-auto truncate font-mono text-slate-500">{path}</span>
    </div>
  )
}
