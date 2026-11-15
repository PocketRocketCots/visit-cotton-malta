import { useCallback, useEffect, useRef, useState } from 'react'
import { AIRPORTS, AIRPORT_BY_CODE, GROUPS } from '../data/airports'
import { haversineKm } from '../lib/dates'

const SORTED_GROUPS = Object.keys(GROUPS).map((g) => ({
  key: g,
  label: GROUPS[g],
  airports: AIRPORTS.filter((a) => a[4] === g).sort((x, y) => x[1].localeCompare(y[1])),
}))

function flightLinks(code, start, end) {
  const short = (x) => x.slice(2).replace(/-/g, '') // 2026-05-01 -> 260501
  const google =
    'https://www.google.com/travel/flights?q=' +
    encodeURIComponent(`Flights from ${code} to MLA${start ? ' on ' + start : ''}${end ? ' returning ' + end : ''}`)
  const sky = `https://www.skyscanner.net/transport/flights/${code.toLowerCase()}/mla/${start ? short(start) + '/' : ''}${
    start && end ? short(end) + '/' : ''
  }`
  return { google, sky }
}

export default function Flights({ start, end, homeTown }) {
  const [town, setTown] = useState('')
  const [hits, setHits] = useState([])
  const [status, setStatus] = useState(null) // null | 'none' | 'error'
  const [pick, setPick] = useState(0)
  const [more, setMore] = useState(false)
  const [code, setCode] = useState('')
  const seq = useRef(0)
  const timer = useRef(0)
  const prefilled = useRef(false)

  // Look the town up with Open-Meteo's free geocoder. `seq` drops answers that arrive out of order.
  const findPlace = useCallback(async (raw) => {
    const q = raw.trim()
    const my = ++seq.current
    setMore(false)
    if (q.length < 3) {
      setHits([])
      setStatus(null)
      return
    }
    try {
      const r = await fetch(
        'https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=' + encodeURIComponent(q),
      )
      const j = await r.json()
      if (my !== seq.current) return
      const results = j.results || []
      setHits(results)
      setPick(0)
      setStatus(results.length ? null : 'none')
    } catch {
      if (my !== seq.current) return
      setHits([])
      setStatus('error')
    }
  }, [])

  // Pre-fill with the home town from the user's profile, once.
  useEffect(() => {
    if (homeTown && !prefilled.current && !town) {
      prefilled.current = true
      setTown(homeTown)
      findPlace(homeTown)
    }
  }, [homeTown, town, findPlace])

  useEffect(() => () => clearTimeout(timer.current), [])

  function onTown(e) {
    const v = e.target.value
    setTown(v)
    setCode('')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => findPlace(v), 500)
  }

  function onCode(e) {
    setCode(e.target.value)
    setTown('')
    setHits([])
    setStatus(null)
    seq.current++
    clearTimeout(timer.current)
  }

  const place = hits[pick]
  let list = []
  if (code) list = [{ a: AIRPORT_BY_CODE[code], d: null, t: 'your choice' }]
  else if (place) {
    const ranked = AIRPORTS.map((a) => ({ a, d: haversineKm(place.latitude, place.longitude, a[2], a[3]) })).sort(
      (x, y) => x.d - y.d,
    )
    // Closest airport, plus up to 3 more within 350 km (or the top 12 if "show more").
    list = (more ? ranked.slice(0, 12) : ranked.filter((x, i) => i === 0 || (i < 4 && x.d <= 350))).map((x, i) => ({
      ...x,
      t: i ? 'alternative' : 'closest to you',
    }))
  }

  return (
    <div className="card">
      <h2>Flights to Malta</h2>
      <label htmlFor="town">Your town or city (anywhere in the world)</label>
      <input
        id="town"
        placeholder="e.g. Grimsby, Leeds, Dublin, Sydney"
        autoComplete="off"
        value={town}
        onChange={onTown}
      />
      {status === 'none' && (
        <p className="mute">Couldn’t find that place. Try another spelling, or choose an airport below.</p>
      )}
      {status === 'error' && (
        <p className="mute">Couldn’t look that up just now. Please choose an airport below instead.</p>
      )}
      {hits.length > 1 && (
        <>
          <label htmlFor="pk">Which one do you mean?</label>
          <select
            id="pk"
            value={pick}
            onChange={(e) => {
              setPick(+e.target.value)
              setMore(false)
            }}
          >
            {hits.map((h, i) => (
              <option key={h.id ?? i} value={i}>
                {[h.name, h.admin1, h.country].filter(Boolean).join(', ')}
              </option>
            ))}
          </select>
        </>
      )}

      <label htmlFor="apsel">…or choose an airport yourself</label>
      <select id="apsel" value={code} onChange={onCode}>
        <option value="">Select…</option>
        {SORTED_GROUPS.map((g) => (
          <optgroup key={g.key} label={g.label}>
            {g.airports.map((a) => (
              <option key={a[0]} value={a[0]}>
                {a[1]} ({a[0]})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {list.length > 0 && (
        <div>
          {list.map(({ a, d, t }) => {
            const { google, sky } = flightLinks(a[0], start, end)
            return (
              <div className="fl" key={a[0]}>
                <b>
                  {a[0]} · {a[1]}
                </b>{' '}
                <span className="mute">
                  {t}
                  {d != null ? ` · about ${Math.round(d * 0.621)} mi (${Math.round(d)} km)` : ''}
                </span>
                <div className="links">
                  <a className="btn p" target="_blank" rel="noopener" href={google}>
                    Google Flights
                  </a>
                  <a className="btn" target="_blank" rel="noopener" href={sky}>
                    Skyscanner
                  </a>
                </div>
              </div>
            )
          })}
          {place && !code && (
            <>
              {!more && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => setMore(true)}>Show more airports</button>
                </div>
              )}
              <p className="mute">Smaller airports may lack direct Malta flights, so a bigger alternative can be cheaper overall.</p>
            </>
          )}
        </div>
      )}
      <p className="mute">
        Suggestions only. Check live prices and routes. Malta International Airport (MLA) is about 30–40 minutes from St
        Paul’s Bay by car.
      </p>
    </div>
  )
}
