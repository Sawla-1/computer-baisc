import { Icon } from './Icon.jsx'
import { QUICK_ACCESS } from '../../game/seed.js'
import { TRASH_ID, ROOT_ID, childrenOf } from '../../game/fs.js'

function Row({ active, onClick, onDropItem, onDragOver, beacon, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDropItem}
      className={`focus-ring group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
        active
          ? 'bg-neon-500/20 text-white ring-1 ring-neon-400/40'
          : 'text-slate-300 hover:bg-white/5'
      } ${beacon ? 'animate-ping-ring ring-2 ring-neon-400' : ''}`}
    >
      {children}
      {count != null ? (
        <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-slate-300">
          {count}
        </span>
      ) : null}
    </button>
  )
}

export function Sidebar({ nodes, currentFolderId, onNavigate, onDropItem, beaconId }) {
  const onDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const makeDrop = (targetId) => (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/node-id')
    if (id) onDropItem(id, targetId)
  }

  const trashCount = childrenOf(nodes, TRASH_ID).length

  return (
    <aside className="flex w-36 shrink-0 flex-col gap-1 overflow-y-auto border-r border-white/5 bg-ink-900/40 p-2 scrollbar-slim md:w-52">
      <p className="px-2.5 pb-1 pt-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-slate-500">
        Quick access
      </p>
      <Row
        active={currentFolderId === ROOT_ID}
        onClick={() => onNavigate(ROOT_ID)}
        onDragOver={onDragOver}
        onDropItem={makeDrop(ROOT_ID)}
      >
        <Icon name="folder" className="h-4 w-4 text-amber-300" />
        Home
      </Row>
      {QUICK_ACCESS.map((q) => (
        <Row
          key={q.id}
          active={currentFolderId === q.id}
          onClick={() => onNavigate(q.id)}
          onDragOver={onDragOver}
          onDropItem={makeDrop(q.id)}
          beacon={beaconId === q.id}
        >
          <span className="w-4 text-center text-sm">{q.emoji}</span>
          <span className="truncate">{q.label}</span>
        </Row>
      ))}

      <p className="px-2.5 pb-1 pt-4 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-slate-500">
        System
      </p>
      <Row
        active={currentFolderId === TRASH_ID}
        onClick={() => onNavigate(TRASH_ID)}
        onDragOver={onDragOver}
        onDropItem={makeDrop(TRASH_ID)}
        beacon={beaconId === TRASH_ID}
        count={trashCount}
      >
        <Icon name="delete" className="h-4 w-4 text-rose-300" />
        Recycle Bin
      </Row>
    </aside>
  )
}
