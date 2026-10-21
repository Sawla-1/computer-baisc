import { useState } from 'react'
import { Home } from './components/Home.jsx'
import { PracticeScreen } from './components/practice/PracticeScreen.jsx'
import { BattleScreen } from './components/battle/BattleScreen.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'
import { ScaleControl } from './components/ui/ScaleControl.jsx'

export default function App() {
  const [screen, setScreen] = useState('home') // home | practice | battle

  return (
    <div className="h-full w-full">
      <ErrorBoundary>
        {screen === 'home' ? (
          <Home onPractice={() => setScreen('practice')} onBattle={() => setScreen('battle')} />
        ) : null}
        {screen === 'practice' ? (
          <PracticeScreen
            onExit={() => setScreen('home')}
            onBattle={() => setScreen('battle')}
          />
        ) : null}
        {screen === 'battle' ? (
          <BattleScreen
            onExit={() => setScreen('home')}
            onPractice={() => setScreen('practice')}
          />
        ) : null}
      </ErrorBoundary>
      <ScaleControl />
    </div>
  )
}
