import { Icon } from './ui/Icon.jsx'

const SKILLS = [
  ['folder', 'Folders & paths'],
  ['rename', 'Renaming'],
  ['cut', 'Cut & paste'],
  ['copy', 'Copy & duplicate'],
  ['delete', 'Delete & restore'],
  ['search', 'Search'],
  ['sort', 'Sorting'],
  ['list', 'Keyboard shortcuts'],
]

export function Home({ onPractice, onBattle }) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-y-auto p-6 scrollbar-slim">
      <div className="w-full max-w-4xl pt-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-neon-300">
            <Icon name="book" className="h-3.5 w-3.5" />
            Computer basics ยท File management
          </span>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl">
            File<span className="text-neon-400">Ops</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            A hands-on trainer for organising files. Learn by doing in Practice, then prove
            yourself against Archivist, the rival file manager, in Battle.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          <ModeCard
            onClick={onPractice}
            tone="neon"
            icon="book"
            title="Practice"
            tagline="Learn one skill at a time"
            points={[
              '13 short missions, from opening a folder to emptying the bin',
              'A coach nudges you only when you get stuck',
              'Every mission explains the idea behind the action',
            ]}
            cta="Start practicing"
          />
          <ModeCard
            onClick={onBattle}
            tone="rose"
            icon="flag"
            title="Battle"
            tagline="Race Archivist, the AI rival"
            points={[
              'Eight objectives, 2:30 on the clock',
              'Wrong file, wrong points โ€” read the objective',
              'Dead heat means sudden death',
            ]}
            cta="Enter the battle"
          />
        </div>

        <div className="panel mt-6 p-5">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500">
            What you will be able to do afterwards
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SKILLS.map(([icon, label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
              >
                <Icon name={icon} className="h-3.5 w-3.5 text-neon-400" />
                {label}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Everything runs in a safe virtual computer: nothing on your own files is touched.
          </p>
        </div>
      </div>
    </div>
  )
}

function ModeCard({ onClick, tone, icon, title, tagline, points, cta }) {
  const styles =
    tone === 'neon'
      ? {
          glow: 'from-neon-500/25',
          ring: 'group-hover:border-neon-400/60',
          text: 'text-neon-300',
          button: 'bg-neon-500/90 text-ink-950 hover:bg-neon-400',
          iconBg: 'bg-neon-500/20 text-neon-300',
        }
      : {
          glow: 'from-rose-500/25',
          ring: 'group-hover:border-rose-400/60',
          text: 'text-rose-300',
          button: 'bg-rose-500/90 text-white hover:bg-rose-500',
          iconBg: 'bg-rose-500/20 text-rose-300',
        }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel group relative overflow-hidden p-6 text-left transition hover:-translate-y-0.5 ${styles.ring}`}
    >
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${styles.glow} to-transparent blur-2xl transition group-hover:scale-125`}
      />
      <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBg}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h2 className="relative mt-4 text-2xl font-bold text-white">{title}</h2>
      <p className={`relative mt-1 text-sm font-medium ${styles.text}`}>{tagline}</p>
      <ul className="relative mt-3 flex flex-col gap-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
            <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
            {p}
          </li>
        ))}
      </ul>
      <span
        className={`relative mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${styles.button}`}
      >
        {cta}
        <Icon name="arrow-right" className="h-4 w-4" />
      </span>
    </button>
  )
}
