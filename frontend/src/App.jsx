import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import { getToken, me, setToken } from './services/api'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(getToken() ? 'loading' : 'anon')

  useEffect(() => {
    if (session !== 'loading') return undefined
    let cancelled = false
    me()
      .then((data) => {
        if (cancelled) return
        setUser(data)
        setSession('auth')
      })
      .catch(() => {
        setToken(null)
        if (!cancelled) setSession('anon')
      })
    return () => {
      cancelled = true
    }
  }, [session])

  if (session === 'loading') {
    return <main><p>Loading…</p></main>
  }

  if (!user) {
    return (
      <Login
        onAuthenticated={(nextUser) => {
          setUser(nextUser)
          setSession('auth')
        }}
      />
    )
  }

  return (
    <Home
      currentUser={user}
      onLogout={() => {
        setUser(null)
        setSession('anon')
      }}
    />
  )
}

export default App
