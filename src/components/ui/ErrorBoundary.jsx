import { Component } from 'react'
import { Icon } from './Icon.jsx'

/**
 * Keeps a runtime error from leaving the learner with a blank screen.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('FileOps crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="panel max-w-md p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300">
            <Icon name="close" className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-xl font-semibold text-white">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-400">
            The trainer hit an error. Reload the page to start again — your files are only
            virtual, so nothing was lost.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="focus-ring mt-4 w-full rounded-xl bg-neon-500/90 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-neon-400"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
