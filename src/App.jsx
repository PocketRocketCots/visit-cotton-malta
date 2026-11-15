import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Book from './pages/Book'
import ThingsToDo from './pages/ThingsToDo'
import Property from './pages/Property'

// Every page except the login page needs a logged-in user.
const PAGES = ['home', 'book', 'todo', 'property', 'login']

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

  // Until we know who's logged in, show nothing; logged-out visitors only ever get the login page.
  const page = !ready ? 'loading' : user ? hash : 'login'

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
        {page === 'login' && <Login />}
        {user && page === 'home' && <Home />}
        {user && page === 'book' && <Book user={user} profile={profile} />}
        {user && page === 'todo' && <ThingsToDo />}
        {user && page === 'property' && <Property />}
      </main>
    </>
  )
}
