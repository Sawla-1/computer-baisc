import { useCallback, useMemo, useReducer } from 'react'
import {
  ROOT_ID,
  TRASH_ID,
  copyNode,
  createNode,
  deleteToTrash,
  descendants,
  emptyTrash,
  moveNode,
  renameNode,
  restoreFromTrash,
  searchTree,
  sortChildren,
} from './fs.js'

const MAX_UNDO = 30

const initialState = (nodes) => ({
  nodes,
  initialNodes: nodes,
  currentFolderId: ROOT_ID,
  selection: [],
  anchorId: null,
  clipboard: null,
  sortBy: {},
  sortDesc: {},
  view: 'grid',
  search: { query: '', results: [] },
  toasts: [],
  createMode: null,
  renamingId: null,
  undoStack: [],
  flags: { trashed: false, purged: false },
  lastEvent: null,
  seq: 0,
})

const withSeq = (state) => ({ ...state, seq: state.seq + 1 })

const addToast = (state, toast) => ({
  ...state,
  seq: state.seq + 1,
  toasts: [
    ...state.toasts,
    { id: `t${state.seq + 1}`, type: 'info', ...toast },
  ].slice(-4),
})

const pushUndo = (state) => ({
  ...state,
  undoStack: [...state.undoStack, state.nodes].slice(-MAX_UNDO),
})

const event = (state, payload) => ({ ...state, lastEvent: { ...payload, seq: state.seq + 1 } })

function reducer(state, action) {
  switch (action.type) {
    case 'navigate': {
      const { id } = action
      if (!state.nodes[id]) return state
      return withSeq(
        event(
          {
            ...state,
            currentFolderId: id,
            selection: [],
            anchorId: null,
            createMode: null,
            renamingId: null,
          },
          { kind: 'navigate', id },
        ),
      )
    }

    case 'select': {
      const { id, mode = 'replace', rangeIds = [] } = action
      if (mode === 'replace') {
        return withSeq(
          event(
            { ...state, selection: [id], anchorId: id },
            { kind: 'select', ids: [id] },
          ),
        )
      }
      if (mode === 'toggle') {
        const has = state.selection.includes(id)
        const selection = has
          ? state.selection.filter((s) => s !== id)
          : [...state.selection, id]
        return withSeq(
          event({ ...state, selection, anchorId: id }, { kind: 'select', ids: selection }),
        )
      }
      const selection = [...new Set([...state.selection, ...rangeIds, id])]
      return withSeq(
        event({ ...state, selection, anchorId: id }, { kind: 'select', ids: selection }),
      )
    }

    case 'clear-selection':
      return withSeq(
        event({ ...state, selection: [], anchorId: null }, { kind: 'select', ids: [] }),
      )

    case 'create-mode':
      return withSeq({ ...state, createMode: action.kind, renamingId: null })

    case 'cancel-input':
      return withSeq({ ...state, createMode: null, renamingId: null })

    case 'rename-mode':
      return withSeq({ ...state, renamingId: action.id, createMode: null })

    case 'create': {
      const { kind, name } = action
      const trimmed = (name || '').trim()
      if (!trimmed) {
        return withSeq(addToast({ ...state, createMode: null }, {
          type: 'bad',
          title: 'Cancelled',
          body: 'A name is required to create a new item.',
        }))
      }
      const target = state.currentFolderId
      const res = createNode(state.nodes, {
        name: trimmed,
        type: kind === 'folder' ? 'folder' : 'file',
        parentId: target,
        size: kind === 'folder' ? 0 : 1200 + trimmed.length * 37,
      })
      if (!res.ok) {
        return withSeq(
          addToast({ ...state, createMode: null }, {
            type: 'bad',
            title: 'Could not create it',
            body: res.error,
          }),
        )
      }
      return withSeq(
        event(
          {
            ...pushUndo(state),
            nodes: res.nodes,
            createMode: null,
            selection: [res.node.id],
            anchorId: res.node.id,
          },
          { kind: 'create', ids: [res.node.id], nodeType: kind },
        ),
      )
    }

    case 'rename': {
      const { id, name } = action
      const trimmed = (name || '').trim()
      if (!trimmed) {
        return withSeq(
          addToast({ ...state, renamingId: null }, {
            type: 'bad',
            title: 'Cancelled',
            body: 'A name is required.',
          }),
        )
      }
      const res = renameNode(state.nodes, id, trimmed)
      if (!res.ok) {
        return withSeq(
          addToast({ ...state, renamingId: null }, {
            type: 'bad',
            title: 'Could not rename',
            body: res.error,
          }),
        )
      }
      if (res.unchanged) {
        return withSeq({ ...state, renamingId: null })
      }
      return withSeq(
        event(
          {
            ...pushUndo(state),
            nodes: res.nodes,
            renamingId: null,
            selection: [id],
          },
          { kind: 'rename', ids: [id], name: trimmed },
        ),
      )
    }

    case 'copy': {
      if (!state.selection.length) return state
      return withSeq(
        event(
          { ...state, clipboard: { mode: 'copy', ids: [...state.selection] } },
          { kind: 'clipboard', clipboardMode: 'copy', ids: [...state.selection] },
        ),
      )
    }

    case 'cut': {
      if (!state.selection.length) return state
      return withSeq(
        event(
          { ...state, clipboard: { mode: 'cut', ids: [...state.selection] } },
          { kind: 'clipboard', clipboardMode: 'cut', ids: [...state.selection] },
        ),
      )
    }

    case 'paste': {
      const clip = state.clipboard
      if (!clip || !clip.ids.length) {
        return withSeq(
          addToast(state, {
            type: 'info',
            title: 'Nothing to paste',
            body: 'Copy or cut an item first, then paste it into this folder.',
          }),
        )
      }
      let nodes = state.nodes
      const moved = []
      const errors = []
      for (const id of clip.ids) {
        const res =
          clip.mode === 'cut'
            ? moveNode(nodes, id, state.currentFolderId)
            : copyNode(nodes, id, state.currentFolderId)
        if (res.ok) {
          nodes = res.nodes
          moved.push(id)
        } else {
          errors.push(res.error)
        }
      }
      if (!moved.length) {
        return withSeq(
          addToast(state, {
            type: 'bad',
            title: 'Could not paste',
            body: errors[0] || 'Unknown problem.',
          }),
        )
      }
      return withSeq(
        event(
          {
            ...pushUndo(state),
            nodes,
            clipboard: clip.mode === 'cut' ? null : state.clipboard,
            selection: moved,
            flags: state.flags,
          },
          { kind: clip.mode === 'cut' ? 'move' : 'copy', ids: moved, into: state.currentFolderId },
        ),
      )
    }

    case 'move': {
      const { id, targetId } = action
      if (targetId === state.nodes[id]?.parentId) return state
      const res = moveNode(state.nodes, id, targetId)
      if (!res.ok) {
        return withSeq(
          addToast(state, { type: 'bad', title: 'Could not move it', body: res.error }),
        )
      }
      if (res.unchanged) return state
      return withSeq(
        event(
          { ...pushUndo(state), nodes: res.nodes, selection: [id] },
          { kind: 'move', ids: [id], into: targetId },
        ),
      )
    }

    case 'delete': {
      const ids = action.ids?.length ? action.ids : state.selection
      if (!ids.length) {
        return withSeq(
          addToast(state, {
            type: 'bad',
            title: 'Nothing selected',
            body: 'Select an item first, then delete it.',
          }),
        )
      }
      let nodes = state.nodes
      const deleted = []
      const errors = []
      for (const id of ids) {
        if (state.nodes[id]?.parentId === TRASH_ID) {
          const res = restoreSafePurge(nodes, id)
          if (res.ok) {
            nodes = res.nodes
            deleted.push(id)
          } else errors.push(res.error)
          continue
        }
        const res = deleteToTrash(nodes, id)
        if (res.ok) {
          nodes = res.nodes
          deleted.push(id)
        } else errors.push(res.error)
      }
      if (!deleted.length) {
        return withSeq(
          addToast(state, {
            type: 'bad',
            title: 'Could not delete',
            body: errors[0] || 'Unknown problem.',
          }),
        )
      }
      return withSeq(
        event(
          {
            ...pushUndo(state),
            nodes,
            selection: [],
            flags: { ...state.flags, trashed: true },
          },
          { kind: 'trash', ids: deleted, permanent: false },
        ),
      )
    }

    case 'restore': {
      const ids = action.ids?.length ? action.ids : state.selection
      if (!ids.length) return state
      let nodes = state.nodes
      const restored = []
      const errors = []
      for (const id of ids) {
        const res = restoreFromTrash(nodes, id)
        if (res.ok) {
          nodes = res.nodes
          restored.push(id)
        } else errors.push(res.error)
      }
      if (!restored.length) {
        return withSeq(
          addToast(state, {
            type: 'bad',
            title: 'Could not restore',
            body: errors[0] || 'Unknown problem.',
          }),
        )
      }
      return withSeq(
        event(
          { ...pushUndo(state), nodes, selection: restored },
          { kind: 'restore', ids: restored },
        ),
      )
    }

    case 'empty-trash': {
      if (!state.nodes[TRASH_ID]?.children.length) {
        return withSeq(
          addToast(state, {
            type: 'info',
            title: 'The Recycle Bin is already empty',
            body: 'Nothing to remove.',
          }),
        )
      }
      const res = emptyTrash(state.nodes)
      return withSeq(
        event(
          {
            ...pushUndo(state),
            nodes: res.nodes,
            selection: [],
            flags: { ...state.flags, purged: true },
          },
          { kind: 'purge', ids: [], permanent: true },
        ),
      )
    }

    case 'sort': {
      const { folderId = state.currentFolderId, key } = action
      const desc = state.sortDesc[folderId] === key
      return withSeq(
        event(
          {
            ...state,
            sortBy: { ...state.sortBy, [folderId]: key },
            sortDesc: { ...state.sortDesc, [folderId]: desc ? undefined : key },
          },
          { kind: 'sort', folderId, key },
        ),
      )
    }

    case 'reset':
      return withSeq({
        ...state,
        nodes: state.initialNodes,
        currentFolderId: ROOT_ID,
        selection: [],
        anchorId: null,
        clipboard: null,
        search: { query: '', results: [] },
        createMode: null,
        renamingId: null,
        undoStack: [],
        flags: { trashed: false, purged: false },
        lastEvent: { kind: 'reset', ids: [], seq: state.seq + 1 },
      })

    case 'view':
      return withSeq({ ...state, view: action.view })

    case 'reset-flags':
      return withSeq({ ...state, flags: { trashed: false, purged: false } })

    case 'search': {
      const query = action.query ?? ''
      const results = query.trim()
        ? searchTree(state.nodes, query).map((r) => ({
            id: r.node.id,
            name: r.node.name,
            type: r.node.type,
            folderId: r.folderId,
          }))
        : []
      return withSeq(
        event(
          { ...state, search: { query, results } },
          { kind: 'search', query, resultIds: results.map((r) => r.id) },
        ),
      )
    }

    case 'undo': {
      if (!state.undoStack.length) {
        return withSeq(
          addToast(state, {
            type: 'info',
            title: 'Nothing to undo',
            body: 'Your last change cannot be undone.',
          }),
        )
      }
      const previous = state.undoStack[state.undoStack.length - 1]
      return withSeq(
        event(
          {
            ...state,
            nodes: previous,
            undoStack: state.undoStack.slice(0, -1),
            selection: [],
            createMode: null,
            renamingId: null,
          },
          { kind: 'undo', ids: [] },
        ),
      )
    }

    case 'toast':
      return withSeq(addToast(state, action.toast))

    case 'dismiss-toast':
      return withSeq({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      })

    default:
      return state
  }
}

/** Permanent delete of a single item that already sits in the Recycle Bin. */
function restoreSafePurge(nodes, id) {
  const node = nodes[id]
  if (!node) return { ok: false, error: 'That item no longer exists.' }
  const next = { ...nodes }
  for (const d of descendants(nodes, id)) delete next[d.id]
  const trash = nodes[TRASH_ID]
  next[TRASH_ID] = {
    ...trash,
    children: trash.children.filter((c) => c !== id),
  }
  delete next[id]
  return { ok: true, nodes: next }
}

export function useExplorer(seedNodes) {
  const [state, dispatch] = useReducer(reducer, seedNodes, initialState)

  const toast = useCallback((t) => dispatch({ type: 'toast', toast: t }), [])

  const actions = useMemo(
    () => ({
      navigate: (id) => dispatch({ type: 'navigate', id }),
      select: (id, mode, rangeIds) =>
        dispatch({ type: 'select', id, mode, rangeIds }),
      clearSelection: () => dispatch({ type: 'clear-selection' }),
      beginCreate: (kind) => dispatch({ type: 'create-mode', kind }),
      beginRename: (id) => dispatch({ type: 'rename-mode', id }),
      cancelInput: () => dispatch({ type: 'cancel-input' }),
      create: (kind, name) => dispatch({ type: 'create', kind, name }),
      rename: (id, name) => dispatch({ type: 'rename', id, name }),
      copy: () => dispatch({ type: 'copy' }),
      cut: () => dispatch({ type: 'cut' }),
      paste: () => dispatch({ type: 'paste' }),
      move: (id, targetId) => dispatch({ type: 'move', id, targetId }),
      remove: (ids) => dispatch({ type: 'delete', ids }),
      restore: (ids) => dispatch({ type: 'restore', ids }),
      emptyTrash: () => dispatch({ type: 'empty-trash' }),
      sort: (folderId, key) => dispatch({ type: 'sort', folderId, key }),
      setView: (view) => dispatch({ type: 'view', view }),
      resetFlags: () => dispatch({ type: 'reset-flags' }),
      reset: () => dispatch({ type: 'reset' }),
      search: (query) => dispatch({ type: 'search', query }),
      undo: () => dispatch({ type: 'undo' }),
      dismissToast: (id) => dispatch({ type: 'dismiss-toast', id }),
    }),
    [],
  )

  const visible = useMemo(() => {
    const folderId = state.currentFolderId
    const key = state.sortBy[folderId] || 'name'
    const desc = !!state.sortDesc[folderId]
    return sortChildren(state.nodes, folderId, key, desc)
  }, [state.nodes, state.currentFolderId, state.sortBy, state.sortDesc])

  const selection = state.selection
  const selectedNodes = selection.map((id) => state.nodes[id]).filter(Boolean)
  const inTrash = state.currentFolderId === TRASH_ID

  return { state, actions, toast, visible, selection, selectedNodes, inTrash }
}
