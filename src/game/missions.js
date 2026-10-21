import { TASK } from './tasks.js'

/**
 * The practice curriculum. Each mission is one teachable concept, expressed
 * as a single concrete goal in the file explorer.
 *
 * coach  – the one line the Coach bubble shows (never a wall of text)
 * hints  – progressively more explicit nudges, revealed as the player stalls
 * beacon – what the hint highlight points at (node | tool | sidebar)
 */
export const MISSIONS = [
  {
    id: 'm01',
    title: 'Open a folder & select a file',
    concept: {
      name: 'Opening & selecting',
      body: 'A folder is a container. Click a folder in the sidebar to open it, then click an item once to select it. One click selects, double-click opens.',
    },
    points: 10,
    coach: 'Open Desktop from the sidebar, then click the item called todo.txt.',
    hints: [
      'The left sidebar lists the standard folders — Desktop is the first one.',
      'Double-click “Desktop” in the sidebar, then single-click “todo.txt”.',
    ],
    beacon: { type: 'sidebar', id: 'sd_desktop' },
    task: {
      type: TASK.SELECT,
      target: { ids: ['sd_todo'], names: ['todo.txt'] },
    },
  },
  {
    id: 'm02',
    title: 'Create your first folder',
    concept: {
      name: 'Folders',
      body: 'New folders group related files. Use the New Folder button, give it a clear name, and it appears inside the folder you are viewing.',
    },
    points: 10,
    coach: 'Open Documents, then use “New folder” to create one called Archive.',
    hints: [
      'Open “Documents” in the sidebar first.',
      'Click the “New folder” button in the toolbar, name it Archive, press Enter.',
    ],
    beacon: { type: 'tool', tool: 'new' },
    task: {
      type: TASK.CREATE_FOLDER,
      target: { parentId: 'sd_documents', name: 'Archive' },
    },
  },
  {
    id: 'm03',
    title: 'Create a text file',
    concept: {
      name: 'Files & extensions',
      body: 'The part after the dot is the extension. .txt is plain text, .pdf a document, .jpg a photo. The extension tells your computer which app opens the file.',
    },
    points: 10,
    coach: 'While you are in Documents, create a file called meeting-notes.txt.',
    hints: [
      'Use the “New file” button in the toolbar.',
      'Name it meeting-notes.txt — keep the .txt extension.',
    ],
    beacon: { type: 'tool', tool: 'new' },
    task: {
      type: TASK.CREATE_FILE,
      target: { parentId: 'sd_documents', name: 'meeting-notes.txt' },
    },
  },
  {
    id: 'm04',
    title: 'Rename a file',
    concept: {
      name: 'Renaming',
      body: 'Renaming changes the label, not the contents. Two items in the same folder can never share a name — that is why you get an error when you duplicate a name.',
    },
    points: 15,
    coach: 'Open Downloads and rename report-final.pdf to report-final-v2.pdf.',
    hints: [
      'Select the file, then press F2 or click “Rename”.',
      'Type report-final-v2.pdf and press Enter.',
    ],
    beacon: { type: 'tool', tool: 'rename' },
    task: {
      type: TASK.RENAME,
      target: { id: 'sd_report', name: 'report-final-v2.pdf' },
    },
  },
  {
    id: 'm05',
    title: 'Move a file (cut & paste)',
    concept: {
      name: 'Move = cut & paste',
      body: 'Cut and paste relocates the original: the file leaves the old folder and appears in the new one. It is the same thing as dragging it across.',
    },
    points: 15,
    coach: 'Cut photo.jpg from Downloads and paste it into Pictures.',
    hints: [
      'Select photo.jpg, click “Cut”, open Pictures, then click “Paste”.',
      'Keyboard: Ctrl+X to cut, Ctrl+V to paste.',
    ],
    beacon: { type: 'tool', tool: 'paste' },
    task: {
      type: TASK.MOVE,
      target: { id: 'sd_photo', parentId: 'sd_pictures' },
    },
  },
  {
    id: 'm06',
    title: 'Drag and drop',
    concept: {
      name: 'Drag & drop',
      body: 'Grab an item and drop it onto a folder to move it. Drop it onto the left sidebar to file it away in one gesture.',
    },
    points: 15,
    coach: 'Drag track01.mp3 from Music and drop it into the Videos folder.',
    hints: [
      'Press and hold on the track01.mp3 icon, then drag it.',
      'Drop it on the “Videos” folder in the sidebar.',
    ],
    beacon: { type: 'sidebar', id: 'sd_videos' },
    task: {
      type: TASK.MOVE,
      target: { id: 'sd_track', parentId: 'sd_videos' },
    },
  },
  {
    id: 'm07',
    title: 'Copy instead of move',
    concept: {
      name: 'Copy vs move',
      body: 'Copy leaves the original where it was and places a duplicate in the destination. Use copy for backups, move when you are reorganising.',
    },
    points: 20,
    coach: 'Copy budget.xlsx from Documents › Work into Downloads. The original must stay in Work.',
    hints: [
      'Open Documents › Work, select budget.xlsx, click “Copy”.',
      'Open Downloads and click “Paste” — budget.xlsx stays in Work as well.',
    ],
    beacon: { type: 'tool', tool: 'copy' },
    task: {
      type: TASK.COPY,
      target: { id: 'sd_budget', parentId: 'sd_downloads' },
    },
  },
  {
    id: 'm08',
    title: 'Select several items at once',
    concept: {
      name: 'Multi-select',
      body: 'Ctrl+click adds one item to the selection. Shift+click selects everything between the first click and the last one. Drag a rubber band over empty space to select a block.',
    },
    points: 20,
    coach: 'In Pictures, select sunset.png and logo.svg together.',
    hints: [
      'Click sunset.png, then hold Ctrl and click logo.svg.',
      'Both names must be highlighted at the same time.',
    ],
    beacon: { type: 'node', id: 'sd_logo' },
    task: {
      type: TASK.SELECT,
      target: { ids: ['sd_sunset', 'sd_logo'], names: ['sunset.png', 'logo.svg'] },
    },
  },
  {
    id: 'm09',
    title: 'Delete (it is reversible)',
    concept: {
      name: 'The Recycle Bin',
      body: 'Deleting does not erase anything. The file goes to the Recycle Bin and keeps its old location, so you can still undo the delete.',
    },
    points: 20,
    coach: 'Send installer.exe from Downloads to the Recycle Bin.',
    hints: [
      'Select installer.exe and click the “Delete” button (or press Delete).',
      'It is not gone — it is now in the Recycle Bin in the sidebar.',
    ],
    beacon: { type: 'tool', tool: 'delete' },
    task: {
      type: TASK.TRASH,
      target: { id: 'sd_installer' },
    },
  },
  {
    id: 'm10',
    title: 'Restore a deleted file',
    concept: {
      name: 'Restore',
      body: 'Restoring puts a file back in the exact folder it came from. If something with that name already exists there, you must rename one of them first.',
    },
    points: 20,
    coach: 'Open the Recycle Bin and restore installer.exe back to Downloads.',
    hints: [
      'Click “Recycle Bin” in the sidebar, select installer.exe, click “Restore”.',
      'It returns to Downloads exactly where it was.',
    ],
    beacon: { type: 'sidebar', id: 'trash' },
    task: {
      type: TASK.RESTORE,
      target: { id: 'sd_installer' },
    },
  },
  {
    id: 'm11',
    title: 'Search for a file',
    concept: {
      name: 'Search',
      body: 'Search looks through the whole tree, not just the folder you are in. Click a result to jump straight to the file and the folder that holds it.',
    },
    points: 25,
    coach: 'Type “budget” in the search box to find the spreadsheet.',
    hints: [
      'Use the search field in the top bar of the explorer.',
      'Type budget and pick budget.xlsx from the results.',
    ],
    beacon: { type: 'tool', tool: 'search' },
    task: {
      type: TASK.SEARCH,
      target: { query: 'budget', id: 'sd_budget' },
    },
  },
  {
    id: 'm12',
    title: 'Sort a folder',
    concept: {
      name: 'Sorting',
      body: 'Sorting re-arranges the view only — it never moves the files themselves. Sort by name, type, size or date to find what you need quickly.',
    },
    points: 25,
    coach: 'Open Documents and sort it by Size.',
    hints: [
      'Click the “Sort” control in the toolbar.',
      'Choose “Size” from the menu.',
    ],
    beacon: { type: 'tool', tool: 'sort' },
    task: {
      type: TASK.SORT,
      target: { folderId: 'sd_documents', key: 'size', label: 'Size' },
    },
  },
  {
    id: 'm13',
    title: 'Empty the Recycle Bin',
    concept: {
      name: 'Permanent delete',
      body: 'Emptying the Recycle Bin erases files for good — there is no undo. Clean up the bin only when you are sure.',
    },
    points: 30,
    coach: 'Delete photo.jpg in Downloads, then empty the Recycle Bin for good.',
    hints: [
      'First send something to the bin — photo.jpg in Downloads is a good candidate.',
      'Open the Recycle Bin and click “Empty bin”.',
    ],
    beacon: { type: 'tool', tool: 'empty-trash' },
    task: {
      type: TASK.EMPTY_TRASH,
      target: { requireTrashed: true },
    },
  },
]

export const missionTask = (mission, index) => ({
  id: `${mission.id}-task`,
  missionId: mission.id,
  type: mission.task.type,
  target: mission.task.target,
  points: mission.points,
  index,
})
