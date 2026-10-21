import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'
import { Tip } from './Tooltip.jsx'
import { SORTS } from '../../game/fs.js'

function ToolButton({ icon, label, hint, onClick, disabled, beacon, tone = 'default', active }) {
  const base =
    'focus-ring flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-35'
  const tones = {
    default: active
      ? 'border-neon-400/60 bg-neon-500/20 text-neon-400'
      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10',
    danger: 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  }
  return (
    <Tip label={label} hint={hint}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`${base} ${tones[tone]} ${
          beacon ? 'animate-ping-ring ring-2 ring-neon-400' : ''
        }`}
      >
        <Icon name={icon} className="h-[1.125rem] w-[1.125rem]" />
      </button>
    </Tip>
  )
}

export function Toolbar({ state, on, beaconTool }) {
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)

  useEffect(() => {
    if (!sortOpen) return
    const onDoc = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [sortOpen])

  const { inTrash, selectionCount, canPaste, sortKey, view, searchQuery } = state

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 bg-ink-850/60 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <ToolButton
          icon="new-folder"
          label="New folder"
          hint="creates a container"
          onClick={on.newFolder}
          beacon={beaconTool === 'new'}
        />
        <ToolButton
          icon="new-file"
          label="New file"
          hint="creates an empty document"
          onClick={on.newFile}
          beacon={beaconTool === 'new-file'}
        />
        <span className="mx-1 h-6 w-px bg-white/10" />
        <ToolButton
          icon="rename"
          label="Rename"
          hint="F2"
          onClick={on.rename}
          disabled={selectionCount !== 1}
          beacon={beaconTool === 'rename'}
        />
        <ToolButton
          icon="cut"
          label="Cut"
          hint="Ctrl+X"
          onClick={on.cut}
          disabled={!selectionCount}
          beacon={beaconTool === 'cut'}
        />
        <ToolButton
          icon="copy"
          label="Copy"
          hint="Ctrl+C"
          onClick={on.copy}
          disabled={!selectionCount}
          beacon={beaconTool === 'copy'}
        />
        <ToolButton
          icon="paste"
          label="Paste"
          hint="Ctrl+V"
          onClick={on.paste}
          disabled={!canPaste}
          beacon={beaconTool === 'paste'}
        />
        <ToolButton
          icon="delete"
          label={inTrash ? 'Delete permanently' : 'Delete'}
          hint={inTrash ? 'cannot be undone' : 'to the Recycle Bin'}
          onClick={on.remove}
          disabled={!selectionCount}
          tone="danger"
          beacon={beaconTool === 'delete'}
        />
        {inTrash ? (
          <>
            <ToolButton
              icon="restore"
              label="Restore"
              hint="back to its folder"
              onClick={on.restore}
              disabled={!selectionCount}
              beacon={beaconTool === 'restore'}
            />
            <ToolButton
              icon="trash"
              label="Empty bin"
              hint="delete for good"
              onClick={on.emptyTrash}
              beacon={beaconTool === 'empty-trash'}
            />
          </>
        ) : null}
        <span className="mx-1 h-6 w-px bg-white/10" />
        <ToolButton
          icon="undo"
          label="Undo"
          hint="Ctrl+Z"
          onClick={on.undo}
          disabled={!state.canUndo}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative" ref={sortRef}>
          <Tip label="Sort by" hint="name, type, date, size">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className={`focus-ring flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition ${
                beaconTool === 'sort'
                  ? 'animate-ping-ring border-neon-400/70 bg-neon-500/20 text-neon-300'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              <Icon name="sort" className="h-4 w-4" />
              {sortKey ? sortKey[0].toUpperCase() + sortKey.slice(1) : 'Sort'}
              <Icon name="chevron-down" className="h-3 w-3 opacity-70" />
            </button>
          </Tip>
          {sortOpen ? (
            <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-md animate-float-in">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    on.sort(s.key)
                    setSortOpen(false)
                  }}
                  className="focus-ring flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                >
                  {s.label}
                  {sortKey === s.key ? (
                    <Icon name="check" className="h-4 w-4 text-neon-400" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Tip label="View" hint={view === 'grid' ? 'grid' : 'list'}>
          <button
            type="button"
            onClick={() => on.setView(view === 'grid' ? 'list' : 'grid')}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
            aria-label="Toggle view"
          >
            <Icon name={view === 'grid' ? 'list' : 'grid'} className="h-[1.125rem] w-[1.125rem]" />
          </button>
        </Tip>

        <div
          className={`focus-within:ring-neon-400/70 flex h-9 w-56 items-center gap-2 rounded-lg border bg-white/5 px-2.5 transition ${
            beaconTool === 'search'
              ? 'animate-ping-ring border-neon-400/70'
              : 'border-white/10 focus-within:ring-2'
          }`}
        >
          <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => on.search(e.target.value)}
            placeholder="Search all files…"
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => on.search('')}
              className="focus-ring rounded p-0.5 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
