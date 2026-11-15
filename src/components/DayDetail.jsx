import { useState } from 'react'
import { daysBetween, fmt } from '../lib/dates'

function AdminPanel({ selA, selB, cfg, onSave }) {
  const blocked = cfg.blocked.includes(selA)
  const [label, setLabel] = useState(cfg.events[selA] || '')
  const days = daysBetween(selA, selB || selA)

  function toggleBlock() {
    const bl = new Set(cfg.blocked)
    days.forEach((d) => (blocked ? bl.delete(d) : bl.add(d)))
    onSave({ blocked: [...bl], events: cfg.events })
  }

  function saveEvent() {
    const v = label.trim()
    const ev = { ...cfg.events }
    days.forEach((d) => {
      if (v) ev[d] = v
      else delete ev[d]
    })
    onSave({ blocked: cfg.blocked, events: ev })
  }

  return (
    <div className="fl">
      <b>Admin</b>
      <div style={{ marginTop: 6 }}>
        <button onClick={toggleBlock}>
          {blocked ? 'Make available' : 'Block this day'}
          {selB ? ' (whole range)' : ''}
        </button>
      </div>
      <label htmlFor="ev">Key event label{selB ? ' (applies to every selected day)' : ''}</label>
      <div className="row">
        <input id="ev" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button className="p" style={{ flex: '0 0 auto' }} onClick={saveEvent}>
          Save
        </button>
      </div>
    </div>
  )
}

export default function DayDetail({ selA, selB, cfg, people, adminOn, onSave }) {
  if (!selA) return <span className="mute">Tap a day for details. Tap a second day to choose a range.</span>
  const ev = cfg.events[selA]
  const ps = people(selA)
  const blocked = cfg.blocked.includes(selA)
  return (
    <div>
      <b>
        {fmt(selA)}
        {selB ? ' → ' + fmt(selB) : ''}
      </b>
      {ev && (
        <div>
          <span className="tag">★</span> {ev}
        </div>
      )}
      {blocked && <div className="mute">Not available this day.</div>}
      <div className="mute">{ps.length ? 'Visiting: ' + ps.map((b) => b.name).join(', ') : 'Nobody booked yet.'}</div>
      {adminOn && <AdminPanel key={selA + '|' + (selB || '')} selA={selA} selB={selB} cfg={cfg} onSave={onSave} />}
    </div>
  )
}
