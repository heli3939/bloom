import { useSyncExternalStore } from 'react'
import Home from './pages/Home'
import { withBase } from './paths'
import { getStoredToken, isDemoModeEnabled, setDemoModeEnabled } from './services/api'
import './App.css'

function subscribeToViewport(callback) {
  window.addEventListener('resize', callback)
  window.addEventListener('orientationchange', callback)
  return () => {
    window.removeEventListener('resize', callback)
    window.removeEventListener('orientationchange', callback)
  }
}

function viewportWidth() {
  return window.innerWidth
}

function App() {
  const width = useSyncExternalStore(subscribeToViewport, viewportWidth, () => 393)
  const mobileScale = width <= 480 ? width / 393 : 1
  const isDemoMode = isDemoModeEnabled()

  if (!isDemoMode && !getStoredToken()) {
    window.location.replace(withBase('auth/welcome.html'))
    return null
  }

  function handleDevModeToggle() {
    setDemoModeEnabled(!isDemoMode)
    window.location.assign(withBase(''))
  }

  return (
    <div
      className="mobile-viewport"
      style={{
        '--bloom-scale': mobileScale,
        '--bloom-height': `${852 * mobileScale}px`,
      }}
    >
      <button className={`dev-mode-toggle ${isDemoMode ? 'enabled' : ''}`} type="button" onClick={handleDevModeToggle}>
        Dev mode {isDemoMode ? 'on' : 'off'}
      </button>
      <Home />
    </div>
  )
}

export default App
