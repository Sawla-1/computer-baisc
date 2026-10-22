import {
  copyNode,
  createNode,
  deleteToTrash,
  emptyTrash,
  moveNode,
  renameNode,
} from './fs.js'
import { TASK } from './tasks.js'

/**
 * The rival: "Archivist", a file-manager bot that races the player through the
 * same objective list on its own mirrored tree. It is deliberately fallible —
 * it fumbles roughly one attempt in four, which is what makes the duel tense.
 */

const WRONG_NAMES = ['Archive_OLD', 'Archive (copy)', 'archive2', 'New folder']
const WRONG_FILES = ['notes_old.txt', 'meeting-notes.doc', 'meeting notes.txt']

const pickWrongFolder = (nodes, rightId) => {
  const options = ['sd_downloads', 'sd_documents', 'sd_pictures', 'sd_desktop']
  const wrong = options.find((id) => id !== rightId && nodes[id])
  return wrong || null
}

export const aiDelay = (task, rng) => {
  const jitter = Math.floor(rng() * 2200) - 900
  return Math.max(2200, (task.aiMs || 5000) + jitter)
}

/**
 * Performs the rival's next move.
 * Returns { nodes, solved, mistake, message }.
 */
export const aiAct = (nodes, task, rng) => {
  const t = task.target
  const fumble = rng() < 0.22

  switch (task.type) {
    case TASK.CREATE_FOLDER: {
      if (fumble) {
        const name = WRONG_NAMES[Math.floor(rng() * WRONG_NAMES.length)]
        const res = createNode(nodes, { name, type: 'folder', parentId: t.parentId })
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: `Archivist created a folder called "${name}" — not the right one.`,
        }
      }
      const res = createNode(nodes, { name: t.name, type: 'folder', parentId: t.parentId })
      return {
        nodes: res.ok ? res.nodes : nodes,
        solved: res.ok,
        mistake: !res.ok,
        message: res.ok
          ? `Archivist created the folder "${t.name}"`
          : `Archivist could not create "${t.name}"`,
      }
    }

    case TASK.CREATE_FILE: {
      if (fumble) {
        const name = WRONG_FILES[Math.floor(rng() * WRONG_FILES.length)]
        const res = createNode(nodes, { name, type: 'file', parentId: t.parentId, size: 900 })
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: `Archivist created "${name}" — wrong name.`,
        }
      }
      const res = createNode(nodes, {
        name: t.name,
        type: 'file',
        parentId: t.parentId,
        size: 1400,
      })
      return {
        nodes: res.ok ? res.nodes : nodes,
        solved: res.ok,
        mistake: !res.ok,
        message: res.ok ? `Archivist created "${t.name}"` : 'Archivist fumbled a file',
      }
    }

    case TASK.RENAME: {
      if (fumble) {
        const wrong = `${t.name.split('.')[0]}-old.${t.name.split('.').pop() || 'txt'}`
        const res = renameNode(nodes, t.id, wrong)
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: `Archivist renamed the file to "${wrong}".`,
        }
      }
      const res = renameNode(nodes, t.id, t.name)
      return {
        nodes: res.ok ? res.nodes : nodes,
        solved: res.ok,
        mistake: !res.ok,
        message: res.ok ? 'Archivist renamed the file' : 'Archivist rename failed',
      }
    }

    case TASK.MOVE: {
      if (fumble) {
        const wrong = pickWrongFolder(nodes, t.parentId)
        if (!wrong) break
        const res = moveNode(nodes, t.id, wrong)
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: `Archivist filed the file in the wrong folder.`,
        }
      }
      const res = moveNode(nodes, t.id, t.parentId)
      return {
        nodes: res.ok ? res.nodes : nodes,
        solved: res.ok,
        mistake: !res.ok,
        message: res.ok ? 'Archivist moved a file into place' : 'Archivist move failed',
      }
    }

    case TASK.COPY: {
      if (fumble) {
        const wrong = pickWrongFolder(nodes, t.parentId)
        if (!wrong) break
        const res = copyNode(nodes, t.id, wrong)
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: 'Archivist copied the file to the wrong folder.',
        }
      }
      const res = copyNode(nodes, t.id, t.parentId)
      return {
        nodes: res.ok ? res.nodes : nodes,
        solved: res.ok,
        mistake: !res.ok,
        message: res.ok ? 'Archivist copied a file' : 'Archivist copy failed',
      }
    }

    case TASK.TRASH: {
      if (fumble) {
        const wrong = nodes['sd_report'] ? 'sd_report' : nodes['sd_photo'] ? 'sd_photo' : null
        if (!wrong) break
        const res = deleteToTrash(nodes, wrong)
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: 'Archivist deleted the wrong file.',
        }
      }
      const res = deleteToTrash(nodes, t.id)
      return {
        nodes: res.ok ? res.nodes : nodes,
        solved: res.ok,
        mistake: !res.ok,
        message: res.ok ? 'Archivist sent a file to the Recycle Bin' : 'Archivist delete failed',
      }
    }

    case TASK.EMPTY_TRASH: {
      if (fumble) {
        const junk = nodes['sd_photo'] ? 'sd_photo' : nodes['sd_track'] ? 'sd_track' : null
        if (!junk) break
        const res = deleteToTrash(nodes, junk)
        return {
          nodes: res.ok ? res.nodes : nodes,
          solved: false,
          mistake: true,
          message: 'Archivist kept binning files instead of emptying the bin.',
        }
      }
      const res = emptyTrash(nodes)
      return {
        nodes: res.nodes,
        solved: true,
        mistake: false,
        message: 'Archivist emptied the Recycle Bin',
      }
    }

    default:
      return { nodes, solved: false, mistake: false, message: 'Archivist is thinking…' }
  }

  /* fumble without a concrete wrong action: just waste the turn */
  return { nodes, solved: false, mistake: true, message: 'Archivist hesitated.' }
}
