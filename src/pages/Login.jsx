import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [signup, setSignup] = useState(false)
  const [name, setName] = useState('')
  const [homeTown, setHomeTown] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null) // { text, ok }

  async function submit(e) {
    e.preventDefault()
    setMsg(null)
    const mail = email.trim()
    if (!mail || password.length < 6) return setMsg({ text: 'Enter your email and a password (6+ characters).' })
    const was = (location.hash || '#home').slice(1)
    let r
    if (signup) {
      if (!name.trim()) return setMsg({ text: 'Please add your name.' })
      r = await supabase.auth.signUp({
        email: mail,
        password,
        options: { data: { name: name.trim(), home_town: homeTown.trim() } },
      })
      if (!r.error && !r.data.session)
        return setMsg({ ok: true, text: 'Check your email to confirm your account, then log in.' })
    } else {
      r = await supabase.auth.signInWithPassword({ email: mail, password })
    }
    if (r.error) return setMsg({ text: r.error.message })
    // Came here from the Log in link: go to booking. Came from Book a trip: stay on it.
    if (was === 'login') location.hash = '#book'
  }

  return (
    <section>
      <form className="card" onSubmit={submit}>
        <h2>{signup ? 'Create your account' : 'Log in'}</h2>
        {signup && (
          <>
            <label htmlFor="an">Your name</label>
            <input id="an" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <label htmlFor="ah">Home town (for flight ideas)</label>
            <input id="ah" placeholder="e.g. Grimsby" value={homeTown} onChange={(e) => setHomeTown(e.target.value)} />
          </>
        )}
        <label htmlFor="ae">Email</label>
        <input id="ae" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="ap">Password</label>
        <input
          id="ap"
          type="password"
          autoComplete={signup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className={'msg' + (msg?.ok ? ' ok' : '')}>{msg?.text}</div>
        <div className="row">
          <button type="submit" className="p">
            {signup ? 'Sign up' : 'Log in'}
          </button>
          <button type="button" onClick={() => setSignup(!signup)}>
            {signup ? 'I have an account' : 'Create account'}
          </button>
        </div>
      </form>
    </section>
  )
}
