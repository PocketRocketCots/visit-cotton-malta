import { useState } from 'react'
import { iso } from '../lib/dates'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function firstOfThisMonth() {
  const n = new Date()
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), 1))
}

export default function Calendar({ cfg, people, selA, selB, onPick }) {
  const [view, setView] = useState(firstOfThisMonth)
  const y = view.getUTCFullYear()
  const m = view.getUTCMonth()
  const pad = (view.getUTCDay() + 6) % 7 // weeks start on Monday
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const shift = (n) => setView(new Date(Date.UTC(y, m + n, 1)))

  const cells = []
  for (let i = 0; i < pad; i++) cells.push(<div className="day out" key={'pad' + i} />)
  for (let n = 1; n <= days; n++) {
    const d = iso(new Date(Date.UTC(y, m, n)))
    const p = people(d).length
    const c = ['day']
    if (cfg.blocked.includes(d)) c.push('blk')
    if (p) c.push('bk')
    if (d === selA) c.push('sel')
    if (selA && selB && d >= selA && d <= selB) c.push('rng')
    cells.push(
      <button className={c.join(' ')} key={d} onClick={() => onPick(d)}>
        <span>{n}</span>
        {cfg.events[d] && <span className="ev">★</span>}
        <span className="n">{p ? p + ' 👤' : ''}</span>
      </button>,
    )
  }

  return (
    <>
      <div className="nav2">
        <button onClick={() => shift(-1)} aria-label="Previous month">
          ‹
        </button>
        <h2 style={{ margin: 0 }}>
          {view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
        </h2>
        <button onClick={() => shift(1)} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="grid">
        {DOW.map((x) => (
          <div className="dow" key={x}>
            {x}
          </div>
        ))}
      </div>
      <div className="grid" style={{ marginTop: 4 }}>
        {cells}
      </div>
    </>
  )
}
