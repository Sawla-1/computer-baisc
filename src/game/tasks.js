import { childrenOf, findByName } from './fs.js'

/**
 * Every objective in the game is expressed as a task with a `target` and a
 * checker that reads the *current* state of the file system. That means the
 * player can do things in any order — as soon as the world satisfies the
 * goal, the task pops with a "solved" animation.
 */

export const TASK = {
  CREATE_FOLDER: 'create-folder',
  CREATE_FILE: 'create-file',
  RENAME: 'rename',
  MOVE: 'move',
  COPY: 'copy',
  TRASH: 'trash',
  PURGE: 'purge',
  RESTORE: 'restore',
  EMPTY_TRASH: 'empty-trash',
  SORT: 'sort',
  SEARCH: 'search',
  SELECT: 'select',
  NAVIGATE: 'navigate',
}

export const describeTask = (task, nodes) => {
  const t = task.target
  const nameOf = (id) => nodes[id]?.name || 'the folder'
  switch (task.type) {
    case TASK.CREATE_FOLDER:
      return `Create a folder named "${t.name}" inside ${nameOf(t.parentId)}`
    case TASK.CREATE_FILE:
      return `Create a file named "${t.name}" inside ${nameOf(t.parentId)}`
    case TASK.RENAME:
      return `Rename "${nameOf(t.id)}" to "${t.name}"`
    case TASK.MOVE:
      return `Move "${nameOf(t.id)}" into ${nameOf(t.parentId)}`
    case TASK.COPY:
      return `Copy "${nameOf(t.id)}" into ${nameOf(t.parentId)}`
    case TASK.TRASH:
      return `Send "${nameOf(t.id)}" to the Recycle Bin`
    case TASK.PURGE:
      return `Permanently delete "${t.name}"`
    case TASK.RESTORE:
      return `Restore "${t.name}" from the Recycle Bin`
    case TASK.EMPTY_TRASH:
      return 'Empty the Recycle Bin'
    case TASK.SORT:
      return `Sort ${nameOf(t.folderId)} by ${t.label}`
    case TASK.SEARCH:
      return `Search for "${t.query}"`
    case TASK.SELECT:
      return t.names
        .map((n) => `"${n}"`)
        .join(' and ') + ' — select both at once'
    case TASK.NAVIGATE:
      return `Open ${nameOf(t.id)}`
    default:
      return task.title || 'Complete the task'
  }
}

export const checkTask = (task, ctx) => {
  const t = task.target
  const { nodes, selection = [], sortBy = {}, search = null, currentFolderId } =
    ctx
  switch (task.type) {
    case TASK.CREATE_FOLDER: {
      const hit = findByName(nodes, t.parentId, t.name)
      return !!hit && hit.type === 'folder'
    }
    case TASK.CREATE_FILE: {
      const hit = findByName(nodes, t.parentId, t.name)
      return !!hit && hit.type === 'file'
    }
    case TASK.RENAME:
      return !!nodes[t.id] && nodes[t.id].name.toLowerCase() === t.name.toLowerCase()
    case TASK.MOVE:
      return !!nodes[t.id] && nodes[t.id].parentId === t.parentId
    case TASK.COPY: {
      const original = nodes[t.id]
      if (!original) return false
      const inTarget = childrenOf(nodes, t.parentId).find(
        (n) => n.name.toLowerCase() === original.name.toLowerCase(),
      )
      return !!inTarget && inTarget.id !== original.id
    }
    case TASK.TRASH:
      /* deleted counts, whether it is still in the bin or already emptied */
      return !nodes[t.id] || nodes[t.id].parentId === 'trash'
    case TASK.PURGE:
      return !nodes[t.id]
    case TASK.RESTORE:
      return !!nodes[t.id] && nodes[t.id].parentId !== 'trash'
    case TASK.EMPTY_TRASH:
      return (
        childrenOf(nodes, 'trash').length === 0 &&
        (!t.requireTrashed || !!ctx.flags?.trashed)
      )
    case TASK.SORT:
      return sortBy[t.folderId] === t.key
    case TASK.SEARCH:
      return (
        !!search &&
        search.query.trim().toLowerCase().includes(t.query.toLowerCase()) &&
        search.results.some((r) => r.id === t.id)
      )
    case TASK.SELECT:
      return t.ids.every((id) => selection.includes(id))
    case TASK.NAVIGATE:
      return currentFolderId === t.id
    default:
      return false
  }
}

/**
 * Soft feedback when the player did the right kind of thing in the wrong
 * place ("right name, wrong folder"). Returns null when there is nothing to say.
 */
export const missionFeedback = (evt, task, nodes) => {
  if (!evt || !evt.ids?.length) return null
  const t = task.target
  const nameOf = (id) => nodes[id]?.name || 'the folder'

  switch (task.type) {
    case TASK.CREATE_FOLDER:
    case TASK.CREATE_FILE: {
      if (evt.kind !== 'create') return null
      const node = nodes[evt.ids[0]]
      if (!node) return null
      if (
        node.name.trim().toLowerCase() === t.name.trim().toLowerCase() &&
        node.parentId !== t.parentId
      ) {
        return {
          title: 'Right name, wrong folder',
          body: `It has to be created inside "${nameOf(t.parentId)}".`,
        }
      }
      return null
    }
    case TASK.MOVE:
    case TASK.COPY: {
      if (evt.kind !== 'move' && evt.kind !== 'copy') return null
      if (!evt.ids.includes(t.id)) return null
      if (evt.into !== t.parentId) {
        return {
          title: 'Right file, wrong folder',
          body: `It belongs in "${nameOf(t.parentId)}".`,
        }
      }
      return null
    }
    case TASK.RENAME: {
      if (evt.kind !== 'rename' || !evt.ids.includes(t.id)) return null
      if ((evt.name || '').trim().toLowerCase() !== t.name.trim().toLowerCase()) {
        return {
          title: 'Almost — check the name',
          body: `The new name has to be exactly "${t.name}".`,
        }
      }
      return null
    }
    default:
      return null
  }
}


