import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Book from './pages/Book'
import ThingsToDo from './pages/ThingsToDo'
import Property from './pages/Property'

const PAGES = ['home', 'book', 'todo', 'property', 'login']
const GATED = ['book'] // only booking a trip needs a login; every other page is public

function readHash() {
  const p = (location.hash || '#home').slice(1)
  return PAGES.includes(p) ? p : 'home'
}

export default function App() {
  const [hash, setHash] = useState(readHash)
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const onHash = () => setHash(readHash())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  // Track the logged-in user. Fires once straight away with the saved session (if any).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const userId = user?.id
  const email = user?.email
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data || { name: email })
      })
    return () => {
      cancelled = true
    }
  }, [userId, email])

  // Logged-in users have no reason to see the login page.
  useEffect(() => {
    if (ready && user && hash === 'login') {
      history.replaceState(null, '', '#home')
      setHash('home')
    }
  }, [ready, user, hash])

  let page = hash
  if (GATED.includes(page) && !user) page = 'login'

  useEffect(() => {
    scrollTo(0, 0)
    document.body.dataset.page = page // lets the CSS give the home page its full-screen layout
  }, [page])

  async function logOut() {
    await supabase.auth.signOut()
    location.hash = '#home'
  }

  return (
    <>
      <Header page={page} loggedIn={!!user} onLogOut={logOut} />
      <main>
        {page === 'home' && <Home />}
        {ready && page === 'login' && <Login />}
        {page === 'book' && user && <Book user={user} profile={profile} />}
        {page === 'todo' && <ThingsToDo user={user} />}
        {page === 'property' && <Property />}
      </main>
    </>
  )
}
