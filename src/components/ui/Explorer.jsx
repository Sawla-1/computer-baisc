import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'
import { FileGlyph, FolderGlyph } from './FileGlyph.jsx'
import { ContextMenu } from './ContextMenu.jsx'
import { Sidebar } from './Sidebar.jsx'
import { StatusBar } from './StatusBar.jsx'
import { Toolbar } from './Toolbar.jsx'
import {
  ROOT_ID,
  TRASH_ID,
  extOf,
  formatDate,
  formatSize,
  kindMeta,
  kindOf,
  pathIds,
  pathString,
} from '../../game/fs.js'

function InlineInput({ value, onChange, onCommit, onCancel, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    const dot = value.lastIndexOf('.')
    if (dot > 0) el.setSelectionRange(0, dot)
    else el.select()
  }, [])
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') onCommit()
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={onCommit}
      className={`focus-ring w-full rounded-md border border-neon-400/70 bg-ink-950 px-1.5 py-0.5 text-sm text-white ${className}`}
    />
  )
}

export function Explorer({ explorer, beacon, onOpenFile, onHintBeacon }) {
  const { state, actions, visible, selection, selectedNodes, inTrash } = explorer
  const [menu, setMenu] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [createValue, setCreateValue] = useState('')
  const gridRef = useRef(null)

  const nodes = state.nodes
  const current = nodes[state.currentFolderId]

  const crumbs = useMemo(() => {
    const ids = pathIds(nodes, state.currentFolderId)
    return ids.map((id) => ({ id, name: id === ROOT_ID ? 'Home' : nodes[id]?.name }))
  }, [nodes, state.currentFolderId])

  const searchResults = state.search.results

  const openItem = (node) => {
    if (node.type === 'folder') {
      actions.navigate(node.id)
    } else {
      onOpenFile?.(node)
    }
  }

  const handleSelect = (node, event) => {
    if (event.shiftKey && state.anchorId) {
      const ids = visible.map((n) => n.id)
      const from = ids.indexOf(state.anchorId)
      const to = ids.indexOf(node.id)
      if (from !== -1 && to !== -1) {
        const [a, b] = from < to ? [from, to] : [to, from]
        actions.select(node.id, 'range', ids.slice(a, b + 1))
        return
      }
    }
    if (event.ctrlKey || event.metaKey) {
      actions.select(node.id, 'toggle')
      return
    }
    actions.select(node.id, 'replace')
  }

  const onDropItem = (id, targetId) => {
    if (!id || !targetId) return
    actions.move(id, targetId)
  }

  const dragStart = (event, node) => {
    event.dataTransfer.setData('text/node-id', node.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  const startRename = (node) => {
    setRenameValue(node.name)
    actions.beginRename(node.id)
  }

  const commitRename = (node) => {
    if (state.renamingId === node.id) actions.rename(node.id, renameValue)
  }

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Delete' && selection.length) {
        e.preventDefault()
        actions.remove()
        return
      }
      if (e.key === 'F2' && selection.length === 1) {
        e.preventDefault()
        const node = nodes[selection[0]]
        if (node) startRename(node)
        return
      }
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        actions.copy()
        return
      }
      if (mod && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        actions.cut()
        return
      }
      if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        actions.paste()
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        actions.undo()
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setCreateValue('')
        actions.beginCreate('folder')
        return
      }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        visible.forEach((n) => actions.select(n.id, 'toggle'))
        return
      }
      if (e.key === 'Escape') {
        actions.cancelInput()
        actions.clearSelection()
        setMenu(null)
        return
      }
      if (e.key === 'Backspace' && state.currentFolderId !== ROOT_ID) {
        e.preventDefault()
        const parent = nodes[state.currentFolderId]?.parentId
        if (parent) actions.navigate(parent)
        return
      }
      if (e.key === 'Enter' && selection.length === 1) {
        const node = nodes[selection[0]]
        if (node) openItem(node)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, visible, state.currentFolderId, state.renamingId, nodes])

  const toolbarState = {
    inTrash,
    selectionCount: selection.length,
    canPaste: !!state.clipboard?.ids?.length,
    sortKey: state.sortBy[state.currentFolderId],
    view: state.view,
    searchQuery: state.search.query,
    canUndo: state.undoStack.length > 0,
  }

  const toolbarActions = {
    newFolder: () => {
      setCreateValue('')
      actions.beginCreate('folder')
    },
    newFile: () => {
      setCreateValue('')
      actions.beginCreate('file')
    },
    rename: () => {
      const node = nodes[selection[0]]
      if (node) startRename(node)
    },
    cut: () => actions.cut(),
    copy: () => actions.copy(),
    paste: () => actions.paste(),
    remove: () => actions.remove(),
    restore: () => actions.restore(),
    emptyTrash: () => actions.emptyTrash(),
    sort: (key) => actions.sort(state.currentFolderId, key),
    setView: (view) => actions.setView(view),
    search: (q) => actions.search(q),
    undo: () => actions.undo(),
  }

  const contextItems = (node) => {
    const one = state.selection.length === 1 && state.selection[0] === node.id
    return [
      { label: 'Open', icon: 'folder-up', onClick: () => openItem(node) },
      { separator: true },
      { label: 'Rename', icon: 'rename', hint: 'F2', disabled: !one, onClick: () => startRename(node) },
      { label: 'Cut', icon: 'cut', hint: 'Ctrl+X', onClick: () => { actions.select(node.id, 'replace'); actions.cut() } },
      { label: 'Copy', icon: 'copy', hint: 'Ctrl+C', onClick: () => { actions.select(node.id, 'replace'); actions.copy() } },
      { separator: true },
      inTrash
        ? { label: 'Restore', icon: 'restore', onClick: () => { actions.select(node.id, 'replace'); actions.restore() } }
        : { label: 'Delete', icon: 'delete', danger: true, hint: 'Del', onClick: () => { actions.select(node.id, 'replace'); actions.remove() } },
    ]
  }

  const beaconNodeId = beacon?.type === 'node' ? beacon.id : null

  const renderGlyph = (node, size = 'h-11 w-11') =>
    node.type === 'folder' ? (
      <FolderGlyph className={size} />
    ) : (
      <FileGlyph kind={kindOf(node)} ext={extOf(node.name)} className={size} />
    )

  return (
    <div className="panel flex h-full min-h-0 flex-col overflow-hidden">
      <Toolbar state={toolbarState} on={toolbarActions} beaconTool={beacon?.tool} />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          nodes={nodes}
          currentFolderId={state.currentFolderId}
          onNavigate={actions.navigate}
          onDropItem={onDropItem}
          beaconId={beacon?.type === 'sidebar' ? beacon.id : null}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {/* breadcrumbs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-white/5 px-4 py-2 text-xs text-slate-400">
            {crumbs.map((c, i) => (
              <span key={c.id} className="flex items-center gap-1">
                {i > 0 ? <Icon name="chevron-right" className="h-3 w-3 opacity-40" /> : null}
                <button
                  type="button"
                  onClick={() => actions.navigate(c.id)}
                  className="focus-ring rounded px-1 py-0.5 transition hover:bg-white/10 hover:text-white"
                >
                  {c.id === TRASH_ID ? 'Recycle Bin' : c.name}
                </button>
              </span>
            ))}
            {searchResults.length ? (
              <span className="ml-3 rounded-full bg-grape-500/20 px-2 py-0.5 text-[0.625rem] font-semibold text-grape-300">
                {searchResults.length} search result{searchResults.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>

          {/* content */}
          <div ref={gridRef} className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-slim">
            {state.search.query.trim() ? (
              <SearchResults
                results={searchResults}
                nodes={nodes}
                onPick={(r) => {
                  actions.navigate(r.folderId)
                  actions.select(r.id, 'replace')
                  actions.search('')
                }}
              />
            ) : (
              <div
                className={
                  state.view === 'grid'
                    ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    : 'flex flex-col gap-1'
                }
              >
                {state.createMode ? (
                  <CreateTile
                    kind={state.createMode}
                    value={createValue}
                    setValue={setCreateValue}
                    onCommit={() => {
                      actions.create(state.createMode, createValue)
                      setCreateValue('')
                    }}
                    onCancel={() => {
                      actions.cancelInput()
                      setCreateValue('')
                    }}
                  />
                ) : null}

                {visible.map((node) =>
                  state.view === 'grid' ? (
                    <ItemCard
                      key={node.id}
                      node={node}
                      nodes={nodes}
                      selected={selection.includes(node.id)}
                      renaming={state.renamingId === node.id}
                      renameValue={renameValue}
                      setRenameValue={setRenameValue}
                      onRenameCommit={() => commitRename(node)}
                      onRenameCancel={() => actions.cancelInput()}
                      onClick={(e) => handleSelect(node, e)}
                      onDoubleClick={() => openItem(node)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        handleSelect(node, e)
                        setMenu({ x: e.clientX, y: e.clientY, node })
                      }}
                      onDragStart={(e) => dragStart(e, node)}
                      onDrop={(e) => {
                        e.preventDefault()
                        const id = e.dataTransfer.getData('text/node-id')
                        if (id) onDropItem(id, node.id)
                      }}
                      beacon={beaconNodeId === node.id}
                      onHintBeacon={onHintBeacon}
                    />
                  ) : (
                    <ItemRow
                      key={node.id}
                      node={node}
                      nodes={nodes}
                      selected={selection.includes(node.id)}
                      renaming={state.renamingId === node.id}
                      renameValue={renameValue}
                      setRenameValue={setRenameValue}
                      onRenameCommit={() => commitRename(node)}
                      onRenameCancel={() => actions.cancelInput()}
                      onClick={(e) => handleSelect(node, e)}
                      onDoubleClick={() => openItem(node)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        handleSelect(node, e)
                        setMenu({ x: e.clientX, y: e.clientY, node })
                      }}
                      onDragStart={(e) => dragStart(e, node)}
                      onDrop={(e) => {
                        e.preventDefault()
                        const id = e.dataTransfer.getData('text/node-id')
                        if (id) onDropItem(id, node.id)
                      }}
                      beacon={beaconNodeId === node.id}
                    />
                  ),
                )}

                {!visible.length && !state.createMode ? (
                  <div className="col-span-full flex flex-col items-center gap-2 py-14 text-center text-sm text-slate-500">
                    <Icon name="folder" className="h-10 w-10 opacity-40" />
                    <p>This folder is empty.</p>
                    <p className="text-xs text-slate-600">
                      Use โ€New folderโ€ or โ€New fileโ€ to add something.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <StatusBar
            items={visible.length}
            selection={selection.length}
            selectedNodes={selectedNodes}
            path={pathString(nodes, state.currentFolderId)}
            inTrash={inTrash}
          />
        </main>
      </div>

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={contextItems(menu.node)}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  )
}

function CreateTile({ kind, value, setValue, onCommit, onCancel }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neon-400/60 bg-neon-500/5 p-3 animate-pop">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 text-2xl">
        {kind === 'folder' ? '๐“' : '๐“'}
      </div>
      <InlineInput
        value={value}
        onChange={setValue}
        onCommit={onCommit}
        onCancel={onCancel}
        className="text-center"
      />
      <p className="text-[0.625rem] text-slate-500">
        {kind === 'folder' ? 'Enter a name for the folder' : 'Enter a name like notes.txt'}
      </p>
    </div>
  )
}

function ItemCard({
  node,
  nodes,
  selected,
  renaming,
  renameValue,
  setRenameValue,
  onRenameCommit,
  onRenameCancel,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDrop,
  beacon,
  onHintBeacon,
}) {
  const meta = kindMeta(node)
  return (
    <div
      draggable={!renaming}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onHintBeacon}
      className={`group relative flex cursor-pointer select-none flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
        selected
          ? 'border-neon-400/70 bg-neon-500/15 ring-1 ring-neon-400/40'
          : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.07]'
      } ${beacon ? 'animate-ping-ring ring-2 ring-neon-400' : ''}`}
    >
      {node.type === 'folder' ? (
        <FolderGlyph className="h-11 w-11" />
      ) : (
        <FileGlyph kind={meta === undefined ? 'file' : kindOf(node)} ext={node.ext} className="h-11 w-11" />
      )}
      {renaming ? (
        <InlineInput
          value={renameValue}
          onChange={setRenameValue}
          onCommit={onRenameCommit}
          onCancel={onRenameCancel}
        />
      ) : (
        <span className="w-full truncate text-[0.8125rem] font-medium text-slate-100" title={node.name}>
          {node.name}
        </span>
      )}
      <span className="text-[0.625rem] text-slate-500">
        {node.type === 'folder'
          ? `${node.children.length} item${node.children.length === 1 ? '' : 's'}`
          : `${meta.label} ยท ${formatSize(node.size)}`}
      </span>
      <span className="absolute right-2 top-2 text-[0.625rem] text-slate-600 opacity-0 transition group-hover:opacity-100">
        {formatDate(node.modified)}
      </span>
    </div>
  )
}

function ItemRow({
  node,
  selected,
  renaming,
  renameValue,
  setRenameValue,
  onRenameCommit,
  onRenameCancel,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDrop,
  beacon,
}) {
  const meta = kindMeta(node)
  return (
    <div
      draggable={!renaming}
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
        selected
          ? 'border-neon-400/70 bg-neon-500/15'
          : 'border-transparent hover:bg-white/5'
      } ${beacon ? 'animate-ping-ring ring-2 ring-neon-400' : ''}`}
    >
      {node.type === 'folder' ? (
        <FolderGlyph className="h-7 w-7" />
      ) : (
        <FileGlyph kind={kindOf(node)} ext={node.ext} className="h-7 w-7" />
      )}
      <div className="min-w-0 flex-1">
        {renaming ? (
          <InlineInput
            value={renameValue}
            onChange={setRenameValue}
            onCommit={onRenameCommit}
            onCancel={onRenameCancel}
          />
        ) : (
          <p className="truncate text-sm text-slate-100">{node.name}</p>
        )}
      </div>
      <span className="hidden w-28 truncate text-xs text-slate-500 sm:block">{meta.label}</span>
      <span className="hidden w-20 text-right text-xs text-slate-500 sm:block">
        {node.type === 'file' ? formatSize(node.size) : 'โ€”'}
      </span>
      <span className="hidden w-28 text-right text-xs text-slate-500 md:block">
        {formatDate(node.modified)}
      </span>
    </div>
  )
}

function SearchResults({ results, nodes, onPick }) {
  if (!results.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-slate-500">
        <Icon name="search" className="h-9 w-9 opacity-40" />
        <p>No files match that search.</p>
        <p className="text-xs text-slate-600">Try a shorter word โ€” search looks at file names.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      {results.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onPick(r)}
          className="focus-ring flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition hover:border-white/10 hover:bg-white/5"
        >
          {r.type === 'folder' ? (
            <FolderGlyph className="h-7 w-7" />
          ) : (
            <FileGlyph kind={kindOf(r)} ext={extOf(r.name)} className="h-7 w-7" />
          )}
          <span className="flex-1 truncate text-sm text-slate-100">{r.name}</span>
          <span className="hidden truncate text-xs text-slate-500 sm:block">
            {pathString(nodes, r.folderId)}
          </span>
          <Icon name="chevron-right" className="h-4 w-4 text-slate-600" />
        </button>
      ))}
    </div>
  )
}
