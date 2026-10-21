import { ROOT_ID, TRASH_ID, extOf } from './fs.js'

const DAY = 24 * 60 * 60 * 1000
const T0 = 1767225600000 // stable "now" so the demo tree never looks stale

const F = (id, name, size, daysAgo) => ({
  id,
  name,
  type: 'file',
  size,
  created: T0 - daysAgo * DAY,
  modified: T0 - daysAgo * DAY,
})

const D = (id, name, daysAgo, children = []) => ({
  id,
  name,
  type: 'folder',
  children,
  created: T0 - daysAgo * DAY,
  modified: T0 - daysAgo * DAY,
})

/** The home tree every session starts from. */
export const HOME_SPEC = [
  D('sd_desktop', 'Desktop', 40, [
    F('sd_screenshot', 'screenshot.png', 2_411_724, 1),
    F('sd_todo', 'todo.txt', 212, 0),
  ]),
  D('sd_documents', 'Documents', 40, [
    D('sd_work', 'Work', 30, [
      F('sd_contract', 'contract.docx', 84_112, 4),
      F('sd_budget', 'budget.xlsx', 156_800, 2),
    ]),
    D('sd_personal', 'Personal', 30, [
      F('sd_receipt', 'receipt.pdf', 42_910, 3),
      F('sd_notes', 'notes.txt', 1_024, 6),
    ]),
  ]),
  D('sd_downloads', 'Downloads', 38, [
    F('sd_installer', 'installer.exe', 24_117_324, 5),
    F('sd_photo', 'photo.jpg', 3_211_882, 7),
    F('sd_data', 'data.csv', 28_400, 1),
    F('sd_report', 'report-final.pdf', 918_220, 8),
  ]),
  D('sd_pictures', 'Pictures', 25, [
    F('sd_sunset', 'sunset.png', 4_118_902, 12),
    F('sd_logo', 'logo.svg', 12_004, 15),
  ]),
  D('sd_music', 'Music', 60, [F('sd_track', 'track01.mp3', 5_242_880, 20)]),
  D('sd_videos', 'Videos', 60, [F('sd_clip', 'clip.mp4', 31_457_280, 22)]),
  D('sd_projects', 'Projects', 18, [
    D('sd_website', 'website', 14, [
      F('sd_index', 'index.html', 4_120, 9),
      F('sd_style', 'style.css', 8_940, 9),
    ]),
  ]),
]

const buildTree = (spec, parentId, nodes) => {
  for (const item of spec) {
    nodes[item.id] = {
      id: item.id,
      name: item.name,
      type: item.type,
      parentId,
      children: item.type === 'folder' ? [] : undefined,
      size: item.type === 'file' ? item.size : 0,
      ext: item.type === 'file' ? extOf(item.name) : '',
      created: item.created,
      modified: item.modified,
    }
    const parent = nodes[parentId]
    if (parent && Array.isArray(parent.children)) parent.children.push(item.id)
    if (item.type === 'folder') buildTree(item.children || [], item.id, nodes)
  }
  return nodes
}

/** Fresh, independent copy of the home tree (player tree and AI tree never share objects). */
export const createSeedTree = () => {
  const nodes = {
    [ROOT_ID]: {
      id: ROOT_ID,
      name: 'Home',
      type: 'folder',
      parentId: null,
      children: [],
      size: 0,
      ext: '',
      created: T0,
      modified: T0,
    },
    [TRASH_ID]: {
      id: TRASH_ID,
      name: 'Recycle Bin',
      type: 'folder',
      parentId: null,
      children: [],
      size: 0,
      ext: '',
      created: T0,
      modified: T0,
      special: true,
    },
  }
  buildTree(HOME_SPEC, ROOT_ID, nodes)
  return nodes
}

export const QUICK_ACCESS = [
  { id: 'sd_desktop', label: 'Desktop', emoji: '🖥️' },
  { id: 'sd_documents', label: 'Documents', emoji: '📄' },
  { id: 'sd_downloads', label: 'Downloads', emoji: '⬇️' },
  { id: 'sd_pictures', label: 'Pictures', emoji: '🖼️' },
  { id: 'sd_music', label: 'Music', emoji: '🎵' },
  { id: 'sd_videos', label: 'Videos', emoji: '🎬' },
  { id: 'sd_projects', label: 'Projects', emoji: '💼' },
]
