import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Calendar from '../components/Calendar'
import DayDetail from '../components/DayDetail'
import BookingForm from '../components/BookingForm'
import VisitList, { KeyDates } from '../components/VisitList'
import Flights from '../components/Flights'
import ApartmentScene from '../components/ApartmentScene'

export default function Book({ user, profile }) {
  const isAdmin = !!profile?.is_admin
  const [cfg, setCfg] = useState({ blocked: [], events: {} })
  const [books, setBooks] = useState([])
  const [selA, setSelA] = useState(null)
  const [selB, setSelB] = useState(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [adminOn, setAdminOn] = useState(false)
  const pageRef = useRef(null)

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

  // Glass panels fade up into view as you scroll down to them
  useEffect(() => {
    const els = pageRef.current.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

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

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = books.filter((b) => b.end_date >= today).length

  return (
    <section className="lux" ref={pageRef}>
      {/* The apartment view stays pinned behind everything while the page scrolls over it */}
      <div className="lux-bg" aria-hidden="false">
        <ApartmentScene />
        <div className="lux-shade" />
        <div className="lux-frame" />
      </div>

      <div className="lux-content">
        {/* Screen 1: headline, blurb and the booking card */}
        <div className="lux-screen lux-intro">
          <h1 className="lux-title">
            Your
            <br />
            Seaside
            <br />
            Getaway
          </h1>
          <div className="lux-blurb">
            <p>
              A bright, modern apartment with a large balcony looking straight out over the bay. Pick your dates and
              I’ll get the kettle on (or the Guinness poured).
            </p>
            <div className="lux-stats">
              <span>
                <b>{upcoming}</b> {upcoming === 1 ? 'visit' : 'visits'} booked
              </span>
            </div>
          </div>
          <BookingForm start={start} end={end} cfg={cfg} name={profile?.name || user.email} onBooked={load}>
            {/* Pick your dates right here on the calendar */}
            <Calendar cfg={cfg} people={people} selA={selA} selB={selB} onPick={pickDay} />
            <div className="legend">
              <div>
                <span className="sw sw-bk">👤</span>
                Someone visiting
              </div>
              <div>
                <span className="sw sw-blk">21</span>
                Not available
              </div>
              <div>
                <span className="sw sw-ev">★</span>
                Key event
              </div>
              <div>
                <span className="sw sw-sel" />
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
              <button className="admin-toggle" onClick={() => setAdminOn(!adminOn)}>
                Admin mode: {adminOn ? 'on' : 'off'}
              </button>
            )}
          </BookingForm>
          <div className="lux-scroll" aria-hidden="true">
            Scroll for dates &amp; flights ↓
          </div>
        </div>

        {/* Screen 2: who's coming on the left, key dates on the right */}
        <div className="lux-screen lux-pair">
          <div className="glass-panel reveal">
            <h2 className="glass-h">Who’s coming</h2>
            <VisitList books={books} isAdmin={isAdmin} userId={user.id} onChange={load} />
          </div>
          <div className="glass-panel reveal">
            <h2 className="glass-h">Key dates</h2>
            <KeyDates cfg={cfg} isAdmin={isAdmin} saveConfig={saveConfig} />
          </div>
        </div>

        {/* Screen 3: flights */}
        <div className="lux-screen lux-pair">
          <Flights start={start} end={end} homeTown={profile?.home_town} className="glass-panel reveal" />
        </div>
      </div>
    </section>
  )
}
