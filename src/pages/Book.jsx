import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Calendar from '../components/Calendar'
import DayDetail from '../components/DayDetail'
import BookingForm from '../components/BookingForm'
import VisitList, { KeyDates } from '../components/VisitList'
import Flights from '../components/Flights'

export default function Book({ user, profile }) {
  const isAdmin = !!profile?.is_admin
  const [cfg, setCfg] = useState({ blocked: [], events: {} })
  const [books, setBooks] = useState([])
  const [selA, setSelA] = useState(null)
  const [selB, setSelB] = useState(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [adminOn, setAdminOn] = useState(false)

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([
      supabase.from('site_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('bookings').select('*').order('start_date'),
    ])
    if (c.data) setCfg({ blocked: c.data.blocked || [], events: c.data.events || {} })
    setBooks(b.data || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const people = useCallback((d) => books.filter((b) => b.start_date <= d && d <= b.end_date), [books])

  // Admin-only: write blocked days / key events back to Supabase.
  async function saveConfig(patch, errorPrefix = '') {
    const { error } = await supabase.from('site_config').update(patch).eq('id', 1)
    if (error) alert(errorPrefix + error.message)
    await load()
  }

  // First tap picks a day, second tap (later day) makes a range, third tap starts again.
  function pickDay(d) {
    let a = selA
    let b = selB
    if (!a || b) {
      a = d
      b = null
    } else if (d < a) a = d
    else b = d
    setSelA(a)
    setSelB(b)
    setStart(a)
    setEnd(b || a)
  }

  return (
    <section>
      <h1>Book a trip</h1>
      {/* The cards flow into as many columns as fit the screen */}
      <div className="flow">
      <div className="card">
        <Calendar cfg={cfg} people={people} selA={selA} selB={selB} onPick={pickDay} />
        <div className="legend">
          <div>
            <span className="sw" style={{ background: 'var(--bk)' }}>
              👤
            </span>
            Someone visiting
          </div>
          <div>
            <span className="sw" style={{ background: 'var(--blk)', color: 'var(--mute)', textDecoration: 'line-through' }}>
              21
            </span>
            Not available
          </div>
          <div>
            <span className="sw" style={{ color: 'var(--gold)' }}>
              ★
            </span>
            Key event
          </div>
          <div>
            <span className="sw" style={{ outline: '2px solid var(--ac)', outlineOffset: -2 }} />
            Selected day
          </div>
        </div>
        <DayDetail
          selA={selA}
          selB={selB}
          cfg={cfg}
          people={people}
          adminOn={adminOn}
          onSave={(patch) => saveConfig(patch, 'Couldn’t save: ')}
        />
        {isAdmin && (
          <button style={{ marginTop: 8 }} onClick={() => setAdminOn(!adminOn)}>
            Admin mode: {adminOn ? 'on' : 'off'}
          </button>
        )}
      </div>

      <BookingForm
        start={start}
        end={end}
        setStart={setStart}
        setEnd={setEnd}
        cfg={cfg}
        name={profile?.name || user.email}
        onBooked={load}
      />

      <div className="card">
        <h2>Who’s coming</h2>
        <VisitList books={books} isAdmin={isAdmin} userId={user.id} onChange={load} />
      </div>
      <div className="card">
        <h2>Key dates</h2>
        <KeyDates cfg={cfg} isAdmin={isAdmin} saveConfig={saveConfig} />
      </div>

      <Flights start={start} end={end} homeTown={profile?.home_town} />
      </div>
    </section>
  )
}
