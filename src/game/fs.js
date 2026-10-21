/**
 * Virtual file system engine.
 * A tree of nodes stored in a flat map so that moves/copies stay cheap.
 *
 * node = {
 *   id, name, type: 'folder' | 'file', parentId, children: [id],
 *   size (bytes, files only), ext (files only), created, modified, special?
 * }
 */

export const ROOT_ID = 'root'
export const TRASH_ID = 'trash'

export const EXT_KIND = {
  txt: 'text',
  md: 'text',
  doc: 'doc',
  docx: 'doc',
  pdf: 'pdf',
  xls: 'sheet',
  xlsx: 'sheet',
  csv: 'sheet',
  ppt: 'slides',
  pptx: 'slides',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  svg: 'image',
  mp3: 'audio',
  wav: 'audio',
  mp4: 'video',
  mov: 'video',
  zip: 'archive',
  rar: 'archive',
  exe: 'app',
  iso: 'app',
  json: 'code',
  js: 'code',
  py: 'code',
}

export const KIND_META = {
  text: { label: 'Text', tone: 'text' },
  doc: { label: 'Document', tone: 'doc' },
  pdf: { label: 'PDF', tone: 'pdf' },
  sheet: { label: 'Spreadsheet', tone: 'sheet' },
  slides: { label: 'Presentation', tone: 'slides' },
  image: { label: 'Image', tone: 'image' },
  audio: { label: 'Audio', tone: 'audio' },
  video: { label: 'Video', tone: 'video' },
  archive: { label: 'Archive', tone: 'archive' },
  app: { label: 'Program', tone: 'app' },
  code: { label: 'Code', tone: 'code' },
  file: { label: 'File', tone: 'file' },
  folder: { label: 'Folder', tone: 'folder' },
}

export const extOf = (name = '') => {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(i + 1).toLowerCase() : ''
}

export const baseOf = (name = '') => {
  const i = name.lastIndexOf('.')
  return i > 0 ? name.slice(0, i) : name
}

export const kindOf = (node) =>
  node.type === 'folder' ? 'folder' : EXT_KIND[extOf(node.name)] || 'file'

export const kindMeta = (node) => KIND_META[kindOf(node)] || KIND_META.file

export const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const formatDate = (ts) =>
  new Date(ts).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

/** Seeded PRNG so battle outcomes are reproducible in tests. */
export const makeRng = (seed) => {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* reads                                                               */
/* ------------------------------------------------------------------ */

export const getNode = (nodes, id) => nodes[id]

export const childrenOf = (nodes, id) => {
  const node = nodes[id]
  if (!node || !Array.isArray(node.children)) return []
  return node.children.map((cid) => nodes[cid]).filter(Boolean)
}

export const isDescendant = (nodes, ancestorId, nodeId) => {
  let cur = nodes[nodeId]
  while (cur && cur.parentId) {
    if (cur.parentId === ancestorId) return true
    cur = nodes[cur.parentId]
  }
  return false
}

export const pathIds = (nodes, id) => {
  const out = []
  let cur = nodes[id]
  let guard = 0
  while (cur && guard++ < 64) {
    out.unshift(cur.id)
    cur = cur.parentId ? nodes[cur.parentId] : null
  }
  return out
}

export const pathString = (nodes, id) =>
  pathIds(nodes, id)
    .map((nid) => (nid === ROOT_ID ? 'Home' : nodes[nid]?.name))
    .filter(Boolean)
    .join(' / ')

export const findByName = (nodes, folderId, name) => {
  const target = name.trim().toLowerCase()
  return (
    childrenOf(nodes, folderId).find(
      (n) => n.name.trim().toLowerCase() === target,
    ) || null
  )
}

export const hasName = (nodes, folderId, name, ignoreId = null) => {
  const target = name.trim().toLowerCase()
  return childrenOf(nodes, folderId).some(
    (n) => n.id !== ignoreId && n.name.trim().toLowerCase() === target,
  )
}

export const searchTree = (nodes, query, rootId = ROOT_ID) => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out = []
  const walk = (folderId) => {
    for (const child of childrenOf(nodes, folderId)) {
      if (child.id === TRASH_ID) continue
      if (child.name.toLowerCase().includes(q)) {
        out.push({ node: child, folderId })
      }
      if (child.type === 'folder') walk(child.id)
    }
  }
  walk(rootId)
  return out
}

/** Every node under a folder, deepest-first, used for recursive delete/copy. */
export const descendants = (nodes, id) => {
  const out = []
  for (const child of childrenOf(nodes, id)) {
    out.push(child)
    if (child.type === 'folder') out.push(...descendants(nodes, child.id))
  }
  return out
}

/* ------------------------------------------------------------------ */
/* writes (pure — every function returns a new nodes map)              */
/* ------------------------------------------------------------------ */

const clone = (nodes) => ({ ...nodes })

const withNode = (nodes, node) => {
  const next = clone(nodes)
  next[node.id] = node
  return next
}

const attach = (nodes, parentId, childId) => {
  const parent = nodes[parentId]
  const next = clone(nodes)
  next[parentId] = { ...parent, children: [...parent.children, childId] }
  return next
}

const detach = (nodes, parentId, childId) => {
  const parent = nodes[parentId]
  const next = clone(nodes)
  next[parentId] = {
    ...parent,
    children: parent.children.filter((c) => c !== childId),
  }
  return next
}

const touch = (nodes, id, ts) =>
  withNode(nodes, { ...nodes[id], modified: ts })

let idCounter = 0
export const newId = (prefix = 'n') => {
  idCounter += 1
  return `${prefix}${idCounter.toString(36)}${Date.now().toString(36).slice(-3)}`
}
export const resetIdCounter = () => {
  idCounter = 0
}

export const createNode = (
  nodes,
  { name, type = 'file', parentId = ROOT_ID, size = 0, ext = '' },
) => {
  const trimmed = name.trim()
  if (!trimmed) {
    return { ok: false, error: 'A name is required.' }
  }
  if (hasName(nodes, parentId, trimmed)) {
    return {
      ok: false,
      error: `"${trimmed}" already exists in this folder. Pick a different name.`,
    }
  }
  const id = newId(type === 'folder' ? 'f' : 'd')
  const now = Date.now()
  const node = {
    id,
    name: trimmed,
    type,
    parentId,
    children: type === 'folder' ? [] : undefined,
    size: type === 'file' ? size : 0,
    ext: type === 'file' ? ext || extOf(trimmed) : '',
    created: now,
    modified: now,
  }
  let next = withNode(nodes, node)
  next = attach(next, parentId, id)
  return { ok: true, nodes: next, node }
}

export const renameNode = (nodes, id, newName) => {
  const node = nodes[id]
  if (!node) return { ok: false, error: 'That item no longer exists.' }
  const trimmed = newName.trim()
  if (!trimmed) return { ok: false, error: 'A name is required.' }
  if (trimmed === node.name) {
    return { ok: true, nodes, node, unchanged: true }
  }
  if (hasName(nodes, node.parentId, trimmed, id)) {
    return {
      ok: false,
      error: `"${trimmed}" already exists in this folder. Names must be unique.`,
    }
  }
  const next = withNode(nodes, {
    ...node,
    name: trimmed,
    ext: node.type === 'file' ? extOf(trimmed) : node.ext,
    modified: Date.now(),
  })
  return { ok: true, nodes: next, node: next[id] }
}

export const moveNode = (nodes, id, targetParentId) => {
  const node = nodes[id]
  const target = nodes[targetParentId]
  if (!node || !target) return { ok: false, error: 'Invalid move target.' }
  if (node.type !== 'folder') {
    /* files may move freely */
  } else if (targetParentId === id || isDescendant(nodes, id, targetParentId)) {
    return {
      ok: false,
      error: 'You cannot move a folder into itself or one of its own subfolders.',
    }
  }
  if (node.parentId === targetParentId) {
    return { ok: true, nodes, node, unchanged: true }
  }
  if (hasName(nodes, targetParentId, node.name)) {
    return {
      ok: false,
      error: `"${node.name}" already exists in "${target.name}". Rename it first.`,
    }
  }
  let next = detach(nodes, node.parentId, id)
  next = attach(next, targetParentId, id)
  next = withNode(next, {
    ...next[id],
    parentId: targetParentId,
    modified: Date.now(),
  })
  return { ok: true, nodes: next, node: next[id] }
}

const copyBranch = (nodes, id, targetParentId, prefix = 'c') => {
  const source = nodes[id]
  const copyId = newId(prefix)
  const copy = {
    ...source,
    id: copyId,
    parentId: targetParentId,
    children: source.type === 'folder' ? [] : undefined,
    created: Date.now(),
    modified: Date.now(),
  }
  let next = withNode(nodes, copy)
  next = attach(next, targetParentId, copyId)
  if (source.type === 'folder') {
    for (const cid of source.children) {
      next = copyBranch(next, cid, copyId, prefix)
    }
  }
  return next
}

export const copyNode = (nodes, id, targetParentId) => {
  const node = nodes[id]
  const target = nodes[targetParentId]
  if (!node || !target) return { ok: false, error: 'Invalid copy target.' }
  if (targetParentId === id || isDescendant(nodes, id, targetParentId)) {
    return { ok: false, error: 'You cannot copy a folder into itself.' }
  }
  if (hasName(nodes, targetParentId, node.name)) {
    return {
      ok: false,
      error: `"${node.name}" already exists in "${target.name}". Copying would overwrite it.`,
    }
  }
  const next = copyBranch(nodes, id, targetParentId)
  return { ok: true, nodes: next, node: next[Object.keys(next).find((k) => k.startsWith('c'))] }
}

export const deleteToTrash = (nodes, id) => {
  const node = nodes[id]
  if (!node) return { ok: false, error: 'That item no longer exists.' }
  if (id === ROOT_ID || id === TRASH_ID) {
    return { ok: false, error: 'That item cannot be deleted.' }
  }
  let next = detach(nodes, node.parentId, id)
  next = withNode(next, { ...next[id], parentId: TRASH_ID, previousParent: node.parentId })
  next = attach(next, TRASH_ID, id)
  return { ok: true, nodes: next, node: next[id] }
}

export const restoreFromTrash = (nodes, id) => {
  const node = nodes[id]
  if (!node) return { ok: false, error: 'That item no longer exists.' }
  if (node.parentId !== TRASH_ID) {
    return { ok: false, error: 'That item is not in the Recycle Bin.' }
  }
  const target = node.previousParent || ROOT_ID
  if (!nodes[target]) {
    return { ok: false, error: 'The original folder is gone — restore it to Home instead.' }
  }
  if (hasName(nodes, target, node.name)) {
    return {
      ok: false,
      error: `"${node.name}" already exists in "${nodes[target].name}". Rename it first.`,
    }
  }
  let next = detach(nodes, TRASH_ID, id)
  next = attach(next, target, id)
  next = withNode(next, {
    ...next[id],
    parentId: target,
    previousParent: undefined,
    modified: Date.now(),
  })
  return { ok: true, nodes: next, node: next[id] }
}

export const emptyTrash = (nodes) => {
  let next = clone(nodes)
  for (const child of childrenOf(nodes, TRASH_ID)) {
    for (const d of descendants(nodes, child.id)) delete next[d.id]
    delete next[child.id]
  }
  next = withNode(next, { ...next[TRASH_ID], children: [] })
  return { ok: true, nodes: next }
}

/* ------------------------------------------------------------------ */
/* sorting                                                              */
/* ------------------------------------------------------------------ */

export const SORTS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'modified', label: 'Date modified' },
  { key: 'size', label: 'Size' },
]

export const sortChildren = (nodes, folderId, sortKey = 'name', desc = false) => {
  const list = [...childrenOf(nodes, folderId)]
  const dir = desc ? -1 : 1
  list.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    switch (sortKey) {
      case 'type':
        return dir * kindMeta(a).label.localeCompare(kindMeta(b).label)
      case 'modified':
        return dir * (a.modified - b.modified)
      case 'size':
        return dir * ((a.size || 0) - (b.size || 0))
      default:
        return dir * a.name.localeCompare(b.name, undefined, { numeric: true })
    }
  })
  return list
}
