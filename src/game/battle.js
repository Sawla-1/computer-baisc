import { TASK, checkTask } from './tasks.js'

export const BATTLE_DURATION = 150 // seconds
export const SCORE = { task: 15, streakBonus: 5, mistake: -5 }

export const BATTLE_TASKS = [
  {
    id: 'b1',
    type: TASK.CREATE_FOLDER,
    target: { parentId: 'sd_documents', name: 'Archive' },
    points: 15,
    aiMs: 4200,
  },
  {
    id: 'b2',
    type: TASK.RENAME,
    target: { id: 'sd_data', name: 'sales-data.csv' },
    points: 15,
    aiMs: 4600,
  },
  {
    id: 'b3',
    type: TASK.MOVE,
    target: { id: 'sd_receipt', parentId: 'sd_work' },
    points: 20,
    aiMs: 5200,
  },
  {
    id: 'b4',
    type: TASK.COPY,
    target: { id: 'sd_budget', parentId: 'sd_downloads' },
    points: 20,
    aiMs: 5600,
  },
  {
    id: 'b5',
    type: TASK.TRASH,
    target: { id: 'sd_installer' },
    points: 20,
    aiMs: 4800,
  },
  {
    id: 'b6',
    type: TASK.EMPTY_TRASH,
    target: { requireTrashed: true },
    points: 25,
    aiMs: 5200,
  },
  {
    id: 'b7',
    type: TASK.MOVE,
    target: { id: 'sd_screenshot', parentId: 'sd_pictures' },
    points: 25,
    aiMs: 5600,
  },
  {
    id: 'b8',
    type: TASK.CREATE_FILE,
    target: { parentId: 'sd_website', name: 'meeting-notes.txt' },
    points: 30,
    aiMs: 6000,
  },
]

export const TIEBREAK_TASK = {
  id: 'tiebreak',
  type: TASK.CREATE_FOLDER,
  target: { parentId: 'sd_documents', name: 'Final' },
  points: 10,
  aiMs: 9000,
}

export const evaluateTasks = (tasks, ctx, doneIds) => {
  const done = []
  for (const task of tasks) {
    if (doneIds.includes(task.id)) continue
    if (task.type === TASK.EMPTY_TRASH && !ctx.flags?.trashed) continue
    if (checkSafe(task, ctx)) done.push(task.id)
  }
  return done
}

const checkSafe = (task, ctx) => {
  try {
    return checkTask(task, ctx)
  } catch {
    return false
  }
}

/** Is this destructive action a mistake relative to the active objectives? */
export const classifyMistake = (evt, tasks) => {
  if (!evt || !evt.ids?.length) return false
  const relevant = tasks.filter(
    (t) =>
      t.type === TASK.TRASH ||
      t.type === TASK.PURGE ||
      t.type === TASK.RENAME ||
      t.type === TASK.MOVE,
  )
  if (!relevant.length) return false

  if (evt.kind === 'trash' || evt.kind === 'purge') {
    const targets = relevant
      .filter((t) => t.type === TASK.TRASH || t.type === TASK.PURGE)
      .flatMap((t) => (t.target.id ? [t.target.id] : []))
    if (!targets.length) return false
    return evt.ids.some((id) => !targets.includes(id))
  }

  if (evt.kind === 'rename') {
    const target = relevant.find((t) => t.type === TASK.RENAME && t.target.id === evt.ids[0])
    if (!target) return false
    return target.target.name.toLowerCase() !== (evt.name || '').toLowerCase()
  }

  if (evt.kind === 'move') {
    const target = relevant.find((t) => t.type === TASK.MOVE && t.target.id === evt.ids[0])
    if (!target) return false
    return target.target.parentId !== evt.into
  }

  return false
}
