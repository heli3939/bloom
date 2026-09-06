import { useSyncExternalStore } from 'react'
import Home from './pages/Home'
import { demoModeEnabled, getStoredToken } from './services/api'
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

  if (!demoModeEnabled && !getStoredToken()) {
    window.location.replace('/auth/login.html')
    return null
  }

  return (
    <div
      className="mobile-viewport"
      style={{
        '--bloom-scale': mobileScale,
        '--bloom-height': `${852 * mobileScale}px`,
      }}
    >
      <Home />
    </div>
  )
}

export default App
