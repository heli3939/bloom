import { useState } from 'react'
import { login, register } from '../services/api'

function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const data =
        mode === 'register'
          ? await register({ username, email, password })
          : await login({ email, password })
      onAuthenticated(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main>
      <header>
        <h1>Bloom</h1>
        <p>Log in or create an account to grow a tree with a friend.</p>
      </header>
      <form className="auth-form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              minLength={2}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}
        </button>
      </form>
      <p>
        {mode === 'register' ? 'Already have an account?' : 'New here?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
        >
          {mode === 'register' ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </main>
  )
}

export default Login
