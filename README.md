# FileOps — Computer Basics: File Management Trainer

A browser game that teaches basic file management (folders, renaming, moving, copying,
deleting, restoring, searching, sorting) through **play**, not slides.

Two modes:

- **Practice** — 13 short missions, each teaching one concept. The onboarding is woven
  into the game: the coach speaks only when you get stuck, hints escalate on their own,
  and every mission ends with a "what you learned" card.
- **Battle** — a head-to-head race against **Archivist**, the AI file manager. Eight
  objectives, 2:30 on the clock, points for correct work, −5 for the wrong file.
  Dead heat goes to sudden death.

Everything runs in a virtual file system. Nothing on the real computer is touched.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

Stack: Vite + React 19 + Tailwind CSS 4 (no other runtime dependencies).

## How the game works

### The virtual computer

`src/game/fs.js` is a real (small) file system: nodes live in a flat map, every mutation
returns a new map, and it enforces the rules a learner needs to meet on a real PC:

- names must be unique inside a folder (case-insensitive)
- a folder cannot be moved into itself or into its own subfolder
- delete moves to the **Recycle Bin** (reversible, remembers the original folder)
- emptying the bin is permanent
- copying keeps the original, cutting does not

### Objectives are checked against state, not clicks

Every goal (`src/game/tasks.js`) is a predicate over the current file system, so the
player can act in any order and the task pops the moment the world satisfies it. That
is what makes the feedback feel immediate instead of scripted.

Task types: create folder/file, rename, move, copy, send to bin, purge, restore,
empty bin, sort, search, multi-select, navigate.

### Practice (FTUE)

`src/game/missions.js` holds the curriculum. Each mission has:

| field | purpose |
| --- | --- |
| `coach` | the single line the coach bubble shows (never a wall of text) |
| `hints[0..1]` | progressively more explicit nudges, revealed only when the player stalls (7s, 15s) |
| `beacon` | what the pulsing highlight points at (toolbar button, file card, sidebar folder) |
| `concept` | the "what you learned" card shown on completion |
| `task` | the objective itself |

Hint escalation resets the moment the player does anything, so the coach never nags
someone who is already working.

### Battle

`src/game/battle.js` defines the objective list and scoring; `src/game/ai.js` is
**Archivist**, a bot that plays the same list on its own mirrored tree. It fumbles
roughly one attempt in four (wrong folder, wrong name, deletes the wrong file) and
loses points when it does, which is what keeps the duel tense.

The rival only wins if it is genuinely faster — it acts through the same real file
system operations, so its progress is honest.

## Project layout

```
src/
  game/
    fs.js            virtual file system engine
    seed.js          the home tree every session starts from
    tasks.js         objective types + checkers + soft feedback
    missions.js      practice curriculum (13 missions)
    battle.js        battle objectives, scoring, mistake classification
    ai.js            the Archivist opponent
    useExplorer.js   React state machine behind the file explorer
  components/
    ui/              explorer, toolbar, sidebar, toasts, context menu, icons
    practice/        practice screen + coach bubble
    battle/          battle screen + result screen
    Home.jsx         main menu
```

## Extending it

**Add a practice mission** — append to `MISSIONS` in `src/game/missions.js`:

```js
{
  id: 'm14',
  title: 'Copy a folder',
  concept: { name: 'Copying folders', body: 'One line a learner will remember.' },
  points: 20,
  coach: 'Copy the Work folder into Archive.',
  hints: ['Select the folder, then click "Copy".', 'Open Archive and click "Paste".'],
  beacon: { type: 'tool', tool: 'copy' },
  task: { type: TASK.COPY, target: { id: 'sd_work', parentId: 'sd_documents' } },
}
```

**Add a battle objective** — append to `BATTLE_TASKS` in `src/game/battle.js` with a
`points` value and an `aiMs` delay, then teach Archivist how to do it in `src/game/ai.js`.

**Tune the rival** — `aiAct()` in `src/game/ai.js`: raise `fumble` (currently `0.22`) to
make the bot clumsy, or raise `aiMs` to make it slower.

## Keyboard shortcuts

| key | action |
| --- | --- |
| `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | copy / cut / paste |
| `F2` | rename the selected item |
| `Delete` | send to the Recycle Bin (permanent inside the bin) |
| `Ctrl+Shift+N` | new folder |
| `Ctrl+A` | select everything in the current folder |
| `Ctrl+Z` | undo |
| `Backspace` | go up one folder |
| `Esc` | cancel the current input |

## Notes for teaching

- The battle clock is 150 seconds; a full clear of all 8 objectives is possible but
  requires speed — that is intentional.
- If you want a shorter demo round, change `BATTLE_DURATION` in `src/game/battle.js`.
- Missions can be replayed from the "Learning path" strip on the right of the practice
  screen; the file system is reset between missions only for the flags that gate
  mission 13, so a mistake in one mission carries over on purpose.
