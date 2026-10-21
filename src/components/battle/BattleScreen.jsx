import { useEffect, useMemo, useRef, useState } from 'react'
import { Explorer } from '../ui/Explorer.jsx'
import { Icon } from '../ui/Icon.jsx'
import { ToastStack } from '../ui/ToastStack.jsx'
import { BATTLE_DURATION, BATTLE_TASKS, SCORE, TIEBREAK_TASK, classifyMistake, evaluateTasks } from '../../game/battle.js'
import { aiAct, aiDelay } from '../../game/ai.js'
import { createSeedTree } from '../../game/seed.js'
import { makeRng } from '../../game/fs.js'
import { useExplorer } from '../../game/useExplorer.js'
import { describeTask } from '../../game/tasks.js'

export function BattleScreen({ onExit, onPractice }) {
  const playerSeed = useMemo(() => createSeedTree(), [])
  const explorer = useExplorer(playerSeed)
  const { state, actions, toast } = explorer

  const [phase, setPhase] = useState('countdown') // countdown | play | tiebreak | over
  const [countdown, setCountdown] = useState(3)
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION)
  const [playerScore, setPlayerScore] = useState(0)
  const [playerMistakes, setPlayerMistakes] = useState(0)
  const [playerDone, setPlayerDone] = useState([])
  const [aiScore, setAiScore] = useState(0)
  const [aiMistakes, setAiMistakes] = useState(0)
  const [aiDone, setAiDone] = useState([])
  const [feed, setFeed] = useState([])
  const [result, setResult] = useState(null)
  const [aiTick, setAiTick] = useState(0)

  const aiRef = useRef({ nodes: createSeedTree(), index: 0 })
  const rngRef = useRef(makeRng(20261021))
  const streakRef = useRef(0)
  const aiStreakRef = useRef(0)
  const doneRef = useRef([])
  const lastEventRef = useRef(null)
  const playerScoreRef = useRef(0)
  const aiScoreRef = useRef(0)
  const phaseRef = useRef(phase)

  useEffect(() => {
    playerScoreRef.current = playerScore
  }, [playerScore])
  useEffect(() => {
    aiScoreRef.current = aiScore
  }, [aiScore])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const activeTasks = phase === 'tiebreak' ? [TIEBREAK_TASK] : BATTLE_TASKS

  /* ---------------- countdown ---------------- */
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown <= 0) {
      setPhase('play')
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900)
    return () => clearTimeout(t)
  }, [countdown, phase])

  /* ---------------- clock ---------------- */
  useEffect(() => {
    if (phase !== 'play' && phase !== 'tiebreak') return
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (timeLeft > 0) return
    if (phaseRef.current === 'play') finishMatch()
    else if (phaseRef.current === 'tiebreak') finishTiebreak('ai')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  /* ---------------- the rival acts ---------------- */
  useEffect(() => {
    if (phase !== 'play' && phase !== 'tiebreak') return
    const ai = aiRef.current
    const tasks = phase === 'tiebreak' ? [TIEBREAK_TASK] : BATTLE_TASKS
    const task = tasks[ai.index]
    if (!task) return
    const rng = rngRef.current
    const timer = setTimeout(() => {
      const res = aiAct(ai.nodes, task, rng)
      ai.nodes = res.nodes
      if (res.solved) {
        ai.index += 1
        aiStreakRef.current += 1
        const gained = task.points + (aiStreakRef.current - 1) * SCORE.streakBonus
        setAiScore((s) => s + gained)
        setAiDone((d) => [...d, task.id])
        if (phase === 'tiebreak') finishTiebreak('ai')
      } else {
        aiStreakRef.current = 0
        setAiMistakes((m) => m + 1)
        setAiScore((s) => s + SCORE.mistake)
      }
      setFeed((f) => [{ id: `${task.id}-${Date.now()}`, text: res.message, good: res.solved }, ...f].slice(0, 14))
      setAiTick((t) => t + 1)
    }, aiDelay(task, rng))
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, aiTick])

  /* ---------------- player scoring ---------------- */
  useEffect(() => {
    if (phase !== 'play' && phase !== 'tiebreak') return
    const ctx = {
      nodes: state.nodes,
      selection: state.selection,
      sortBy: state.sortBy,
      search: state.search,
      currentFolderId: state.currentFolderId,
      flags: state.flags,
    }
    const newly = evaluateTasks(activeTasks, ctx, doneRef.current)
    if (!newly.length) return
    doneRef.current = [...doneRef.current, ...newly]
    setPlayerDone((d) => [...d, ...newly])
    const base = newly.reduce(
      (sum, id) => sum + (activeTasks.find((t) => t.id === id)?.points || 0),
      0,
    )
    const bonus = streakRef.current * SCORE.streakBonus * newly.length
    streakRef.current += newly.length
    setPlayerScore((s) => s + base + bonus)
    const label = activeTasks.find((t) => t.id === newly[0])
    toast({
      type: 'good',
      title: label ? describeTask(label, state.nodes) : 'Objective complete',
      body: `+${base + bonus} points`,
    })
    if (phase === 'tiebreak') finishTiebreak('player')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodes, state.selection, state.sortBy, state.search, phase])

  /* ---------------- player mistakes ---------------- */
  useEffect(() => {
    const evt = state.lastEvent
    if (!evt || evt.seq === lastEventRef.current?.seq) return
    lastEventRef.current = evt
    if (phase !== 'play' && phase !== 'tiebreak') return
    if (classifyMistake(evt, BATTLE_TASKS)) {
      setPlayerMistakes((m) => m + 1)
      setPlayerScore((s) => s + SCORE.mistake)
      streakRef.current = 0
      toast({
        type: 'bad',
        title: 'That was the wrong file',
        body: `−${Math.abs(SCORE.mistake)} points. Read the objective again.`,
      })
    }
  }, [state.lastEvent, phase, toast])

  function finishMatch() {
    if (phaseRef.current === 'over') return
    const p = playerScoreRef.current
    const a = aiScoreRef.current
    if (p === a) {
      aiRef.current.index = 0
      aiStreakRef.current = 0
      setPhase('tiebreak')
      setTimeLeft(20)
      toast({
        type: 'hint',
        title: 'Dead heat!',
        body: 'Sudden death: first to create the “Final” folder wins.',
      })
      return
    }
    setResult(p > a ? 'win' : 'lose')
    setPhase('over')
  }

  function finishTiebreak(winner) {
    if (phaseRef.current === 'over') return
    setResult(winner === 'player' ? 'win' : 'lose')
    setPhase('over')
  }

  const rematch = () => {
    setPhase('countdown')
    setCountdown(3)
    setTimeLeft(BATTLE_DURATION)
    setPlayerScore(0)
    setPlayerMistakes(0)
    setPlayerDone([])
    setAiScore(0)
    setAiMistakes(0)
    setAiDone([])
    setFeed([])
    setResult(null)
    doneRef.current = []
    streakRef.current = 0
    aiStreakRef.current = 0
    aiRef.current = { nodes: createSeedTree(), index: 0 }
    rngRef.current = makeRng(Math.floor(Math.random() * 1e9))
    actions.reset()
    setAiTick((t) => t + 1)
  }

  const currentTask = activeTasks.find((t) => !playerDone.includes(t.id))
  const minutes = Math.floor(timeLeft / 60)
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const low = timeLeft <= 30

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4 scrollbar-slim lg:overflow-hidden">
      {/* HUD */}
      <div className="panel flex flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-500/20 text-neon-300">
            <Icon name="bolt" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              You
            </p>
            <p className="text-xl font-bold text-white">{playerScore}</p>
          </div>
        </div>

        <div className="mx-auto text-center">
          <p className={`font-mono text-3xl font-bold tabular-nums ${low ? 'text-rose-400 animate-pulse-soft' : 'text-white'}`}>
            {minutes}:{seconds}
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {phase === 'tiebreak' ? 'sudden death' : 'time left'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Archivist
            </p>
            <p className="text-xl font-bold text-white">{aiScore}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
            <Icon name="skull" className="h-5 w-5" />
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="focus-ring ml-auto rounded-lg px-2.5 py-1.5 text-[11px] text-slate-400 transition hover:text-white"
        >
          Surrender
        </button>
      </div>

      {/* objective ticker */}
      <div className="panel flex items-center gap-3 px-4 py-2.5">
        <span className="shrink-0 rounded-md bg-grape-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-grape-300">
          Objective {Math.min(playerDone.length + 1, activeTasks.length)}/{activeTasks.length}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-slate-100">
          {currentTask ? describeTask(currentTask, state.nodes) : 'All objectives cleared!'}
        </p>
        <span className="hidden shrink-0 text-[11px] text-slate-500 sm:block">
          mistakes −{playerMistakes * Math.abs(SCORE.mistake)} pts
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <div className="flex min-h-[520px] min-w-0 flex-1 flex-col lg:min-h-0">
          <Explorer
            explorer={explorer}
            onOpenFile={(node) =>
              toast({
                type: 'info',
                title: `Opening ${node.name}`,
                body: 'Keep the clock in mind — the rival does not wait.',
              })
            }
          />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[300px] lg:overflow-hidden">
          <div className="panel flex min-h-0 flex-1 flex-col p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Objective board
            </p>
            <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-slim">
              {activeTasks.map((t) => {
                const youDone = playerDone.includes(t.id)
                const rivalDone = aiDone.includes(t.id)
                return (
                  <div
                    key={t.id}
                    className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${
                      youDone
                        ? 'border-neon-400/30 bg-neon-500/10'
                        : 'border-white/5 bg-white/[0.03]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                        youDone ? 'bg-neon-500/80 text-ink-950' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {youDone ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block leading-snug ${youDone ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                        {describeTask(t, state.nodes)}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                        rivalDone ? 'bg-rose-500/80 text-white' : 'bg-white/10 text-slate-500'
                      }`}
                      title={rivalDone ? 'Archivist finished it' : 'Archivist has not finished it'}
                    >
                      {rivalDone ? '✓' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel max-h-56 overflow-y-auto p-3 scrollbar-slim">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Rival activity
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {feed.length ? (
                feed.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-start gap-2 text-[11px] leading-snug text-slate-400 animate-float-in"
                  >
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${f.good ? 'bg-rose-400' : 'bg-slate-600'}`} />
                    {f.text}
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-slate-600">Archivist is warming up…</li>
              )}
            </ul>
          </div>
        </aside>
      </div>

      {phase === 'countdown' ? (
        <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center bg-ink-950/80 backdrop-blur-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Get ready</p>
          <p className="mt-2 text-7xl font-black text-neon-400 animate-pop">{countdown || 'GO'}</p>
          <p className="mt-4 max-w-sm text-center text-sm text-slate-400">
            Eight objectives. Two and a half minutes. Highest score wins.
          </p>
        </div>
      ) : null}

      {phase === 'over' && result ? (
        <ResultCard
          result={result}
          nodes={state.nodes}
          playerScore={playerScore}
          aiScore={aiScore}
          playerDone={playerDone}
          aiDone={aiDone}
          tasks={activeTasks}
          playerMistakes={playerMistakes}
          aiMistakes={aiMistakes}
          onRematch={rematch}
          onExit={onExit}
          onPractice={onPractice}
        />
      ) : null}

      <ToastStack toasts={state.toasts} onDismiss={actions.dismissToast} />
    </div>
  )
}

function ResultCard({
  result,
  nodes,
  playerScore,
  aiScore,
  playerDone,
  aiDone,
  tasks,
  playerMistakes,
  aiMistakes,
  onRematch,
  onExit,
  onPractice,
}) {
  const win = result === 'win'
  const draw = result === 'draw'
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-pop overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl">
        <div
          className={`flex flex-col items-center gap-3 px-6 py-7 text-center ${
            win
              ? 'bg-gradient-to-b from-neon-500/25 to-transparent'
              : draw
                ? 'bg-gradient-to-b from-mango-400/20 to-transparent'
                : 'bg-gradient-to-b from-rose-500/25 to-transparent'
          }`}
        >
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              win ? 'bg-neon-500/25 text-neon-300' : draw ? 'bg-mango-400/20 text-mango-400' : 'bg-rose-500/25 text-rose-300'
            }`}
          >
            <Icon name={win ? 'trophy' : draw ? 'flag' : 'skull'} className="h-8 w-8" />
          </span>
          <h2 className="text-3xl font-black tracking-tight text-white">
            {win ? 'You win!' : draw ? 'Draw' : 'You lose'}
          </h2>
          <p className="max-w-sm text-sm text-slate-400">
            {win
              ? 'Clean work. You organised those files faster and more accurately than Archivist.'
              : draw
                ? 'Same score — the desk is still a mess. Go again?'
                : 'Archivist got the job done first. Review the board below and try again.'}
          </p>
          <div className="mt-2 flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-white">{playerScore}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">You</p>
            </div>
            <span className="text-xl text-slate-600">—</span>
            <div className="text-center">
              <p className="text-3xl font-black text-white">{aiScore}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Archivist</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Objectives
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {tasks.map((t) => {
              const you = playerDone.includes(t.id)
              const rival = aiDone.includes(t.id)
              return (
                <div key={t.id} className="flex items-center gap-2 text-[11px]">
                  <span className={`h-2 w-2 rounded-full ${you ? 'bg-neon-400' : 'bg-white/15'}`} />
                  <span className={`flex-1 truncate ${you || rival ? 'text-slate-300' : 'text-slate-600'}`}>
                    {describeTask(t, nodes)}
                  </span>
                  <span className="text-slate-500">
                    {you && !rival ? 'you were first' : rival && !you ? 'Archivist was first' : you && rival ? 'both' : 'neither'}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Slips — you: {playerMistakes} · Archivist: {aiMistakes}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onRematch}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-neon-500/90 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-neon-400"
            >
              <Icon name="flag" className="h-4 w-4" />
              Rematch
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPractice}
                className="focus-ring flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Practice
              </button>
              <button
                type="button"
                onClick={onExit}
                className="focus-ring flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Main menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
