import { useState } from 'react'
import { signIn } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <img src="/crest.png" alt="Mugutha FC crest" className="login-crest" />
        <h1>Mugutha FC</h1>
        <p className="login-sub">Club admin sign in</p>

        <label>
          Email
          <input type="email" autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="login-note">Admins are added by the club in Supabase.</p>
      </form>
    </main>
  )
}
