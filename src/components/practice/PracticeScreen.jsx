import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Explorer } from '../ui/Explorer.jsx'
import { Icon } from '../ui/Icon.jsx'
import { ToastStack } from '../ui/ToastStack.jsx'
import { Coach } from './Coach.jsx'
import { MISSIONS, missionTask } from '../../game/missions.js'
import { checkTask, describeTask, missionFeedback } from '../../game/tasks.js'
import { classifyMistake } from '../../game/battle.js'
import { createSeedTree } from '../../game/seed.js'
import { useExplorer } from '../../game/useExplorer.js'

export function PracticeScreen({ onExit, onBattle }) {
  const seed = useMemo(() => createSeedTree(), [])
  const explorer = useExplorer(seed)
  const { state, actions, toast } = explorer

  const [missionIndex, setMissionIndex] = useState(0)
  const [phase, setPhase] = useState('active') // active | concept | summary
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [solvedIds, setSolvedIds] = useState([])
  const [lastEvent, setLastEvent] = useState(null)
  const solvedRef = useRef(new Set())

  const mission = MISSIONS[missionIndex]
  const task = useMemo(() => missionTask(mission, missionIndex), [mission, missionIndex])

  const ctx = useMemo(
    () => ({
      nodes: state.nodes,
      selection: state.selection,
      sortBy: state.sortBy,
      search: state.search,
      currentFolderId: state.currentFolderId,
      flags: state.flags,
    }),
    [state.nodes, state.selection, state.sortBy, state.search, state.currentFolderId, state.flags],
  )

  const goal = useMemo(() => describeTask(task, state.nodes), [task, state.nodes])

  /* ---------- goal detection: instant feedback, no modal ---------- */
  useEffect(() => {
    if (phase !== 'active') return
    if (solvedRef.current.has(task.id)) return
    if (!checkTask(task, ctx)) return
    solvedRef.current.add(task.id)
    setSolvedIds((ids) => [...ids, task.missionId])
    setStreak((s) => s + 1)
    setXp((x) => x + task.points)
    toast({
      type: 'good',
      title: 'Mission complete',
      body: `+${task.points} XP ยท streak ${streak + 1}`,
    })
    setPhase('concept')
  }, [ctx, phase, task, toast, streak])

  /* ---------- mistake feedback ---------- */
  useEffect(() => {
    const evt = state.lastEvent
    if (!evt || evt.seq === lastEvent?.seq) return
    setLastEvent(evt)
    if (phase !== 'active') return
    if (classifyMistake(evt, [task])) {
      setMistakes((m) => m + 1)
      toast({
        type: 'hint',
        title: 'Careful โ€” that was not the target',
        body: goal,
      })
      return
    }
    const soft = missionFeedback(evt, task, state.nodes)
    if (soft) toast({ type: 'hint', title: soft.title, body: soft.body })
  }, [state.lastEvent, task, phase, goal, toast, lastEvent, state.nodes])

  /* ---------- hint escalation (only while the player is stuck) ---------- */
  const activitySeq = state.lastEvent?.seq ?? 0
  useEffect(() => {
    if (phase !== 'active') return
    setHintLevel(0)
    const t1 = setTimeout(() => setHintLevel(1), 7000)
    const t2 = setTimeout(() => setHintLevel(2), 15000)
    const t3 = setTimeout(() => setHintLevel(3), 25000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [activitySeq, phase, missionIndex])

  const nextHint = useCallback(() => {
    setHintLevel((l) => {
      const next = Math.min(3, l + 1)
      setHintsUsed((h) => h + 1)
      return next
    })
  }, [])

  const goToMission = useCallback(
    (index) => {
      setMissionIndex(index)
      setPhase('active')
      setHintLevel(0)
      solvedRef.current.delete(missionTask(MISSIONS[index], index).id)
      actions.resetFlags()
    },
    [actions],
  )

  const handleNext = () => {
    if (missionIndex + 1 >= MISSIONS.length) {
      setPhase('summary')
      return
    }
    goToMission(missionIndex + 1)
  }

  const coachText = phase === 'active' ? mission.coach : mission.concept.body
  const hintText =
    hintLevel === 1 ? mission.hints[0] : hintLevel >= 2 ? mission.hints[1] : null
  const beacon = hintLevel >= 2 ? mission.beacon : null

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 scrollbar-slim lg:flex-row lg:overflow-hidden">
      <div className="relative flex min-h-[35rem] flex-1 flex-col lg:min-h-0">
        <Explorer
          explorer={explorer}
          beacon={beacon}
          onOpenFile={(node) =>
            toast({
              type: 'info',
              title: `Opening ${node.name}`,
              body: 'On a real computer this would open in the matching app.',
            })
          }
        />

        {phase === 'active' ? (
          <div className="pointer-events-none absolute bottom-12 left-3 z-40 w-[min(22rem,calc(100%-1.5rem))] sm:left-4">
            <div className="pointer-events-auto">
              <Coach
                coach={coachText}
                hint={hintText}
                level={hintLevel}
                onNextHint={nextHint}
                nextHintLabel="Give me a hint"
                onShowMe={() => setHintLevel(3)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[20rem] lg:overflow-y-auto lg:pr-1 scrollbar-slim">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-neon-400/80">
              Practice
            </span>
            <button
              type="button"
              onClick={onExit}
              className="focus-ring rounded-lg px-2 py-1 text-[0.6875rem] text-slate-400 transition hover:text-white"
            >
              Exit
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-white">{mission.title}</h2>
            <span className="text-xs font-semibold text-mango-400">+{mission.points} XP</span>
          </div>

          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-slate-500">
              Goal
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-100">{goal}</p>
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="bolt" className="h-4 w-4 text-mango-400" />
              {xp} XP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="check" className="h-4 w-4 text-neon-400" />
              {solvedIds.length}/{MISSIONS.length}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="flag" className="h-4 w-4 text-rose-300" />
              {mistakes} slip{mistakes === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <MissionMap
          total={MISSIONS.length}
          index={missionIndex}
          solved={solvedIds}
          onPick={goToMission}
        />

        <div className="panel p-4">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            Concept in this mission
          </p>
          <p className="mt-1.5 text-sm font-semibold text-grape-300">{mission.concept.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{mission.concept.body}</p>
        </div>
      </aside>

      {phase === 'concept' ? (
        <ConceptCard
          mission={mission}
          xp={task.points}
          isLast={missionIndex + 1 >= MISSIONS.length}
          onNext={handleNext}
        />
      ) : null}

      {phase === 'summary' ? (
        <SummaryCard
          xp={xp}
          solved={solvedIds.length}
          mistakes={mistakes}
          hints={hintsUsed}
          onExit={onExit}
          onBattle={onBattle}
          onRepeat={() => goToMission(0)}
        />
      ) : null}

      <ToastStack toasts={state.toasts} onDismiss={actions.dismissToast} />
    </div>
  )
}

function MissionMap({ total, index, solved, onPick }) {
  return (
    <div className="panel p-4">
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500">
        Learning path
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const isCurrent = i === index
          const isDone = solved.includes(MISSIONS[i].id)
          return (
            <button
              key={MISSIONS[i].id}
              type="button"
              onClick={() => onPick(i)}
              title={MISSIONS[i].title}
              className={`focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                isCurrent
                  ? 'bg-neon-500/25 text-neon-300 ring-1 ring-neon-400/70'
                  : isDone
                    ? 'bg-white/10 text-neon-300 hover:bg-white/20'
                    : 'bg-white/5 text-slate-500 hover:bg-white/10'
              }`}
            >
              {isDone ? <Icon name="check" className="h-4 w-4" /> : i + 1}
            </button>
          )
        })}
      </div>
      <p className="mt-2.5 text-[0.6875rem] leading-relaxed text-slate-500">
        Every mission teaches one skill. Tap a completed one to replay it.
      </p>
    </div>
  )
}

function ConceptCard({ mission, xp, isLast, onNext }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-pop rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-neon-500/20 text-neon-300">
            <Icon name="check" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-neon-400/80">
              Mission complete ยท +{xp} XP
            </p>
            <h3 className="text-xl font-semibold text-white">{mission.title}</h3>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-grape-400/25 bg-grape-500/10 p-4">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-grape-300/80">
            What you learned ยท {mission.concept.name}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{mission.concept.body}</p>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-neon-500/90 px-4 py-3 text-sm font-bold text-ink-950 transition hover:bg-neon-400"
        >
          {isLast ? 'Finish practice' : 'Next mission'}
          <Icon name="arrow-right" className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function SummaryCard({ xp, solved, mistakes, hints, onExit, onBattle, onRepeat }) {
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-pop rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mango-400/20 text-mango-400">
          <Icon name="trophy" className="h-6 w-6" />
        </span>
        <h3 className="mt-3 text-2xl font-semibold text-white">Practice complete</h3>
        <p className="mt-1 text-sm text-slate-400">
          You have handled every core file-management skill. Now prove it against the rival.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="XP" value={xp} tone="text-mango-400" />
          <Stat label="Missions" value={`${solved}/13`} tone="text-neon-400" />
          <Stat label="Slips" value={mistakes} tone="text-rose-300" />
        </div>
        <p className="mt-2 text-center text-[0.6875rem] text-slate-500">
          {hints} hint{hints === 1 ? '' : 's'} used
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={onBattle}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
          >
            <Icon name="flag" className="h-4 w-4" />
            Enter the battle
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRepeat}
              className="focus-ring flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Replay missions
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
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 py-3">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-[0.625rem] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  )
}
