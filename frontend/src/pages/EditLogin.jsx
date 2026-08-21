import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EDIT_AUTH_KEY = 'music-cms-edit-authenticated'

export { EDIT_AUTH_KEY }

export default function EditLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitted) return
    setSubmitted(true)

    if (username === 'amar' && password === 'gurung999') {
      sessionStorage.setItem(EDIT_AUTH_KEY, 'true')
      navigate('/edit', { replace: true })
      return
    }

    navigate('/discography', { replace: true })
  }

  return (
    <main className="edit-login">
      <section className="edit-login-panel">
        <p className="eyebrow">Restricted area</p>
        <h1>Edit collection</h1>
        <form onSubmit={handleSubmit}>
          <label><span>Username</span><input autoComplete="username" autoFocus value={username} onChange={(event) => setUsername(event.target.value)} disabled={submitted} required /></label>
          <label><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitted} required /></label>
          <button type="submit" disabled={submitted}>Enter</button>
        </form>
      </section>
    </main>
  )
}
