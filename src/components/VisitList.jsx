import { supabase } from '../lib/supabase'
import { daysBetween, fmt, iso, nextDay } from '../lib/dates'

// Merge consecutive days with the same event label into one range.
function groupEvents(events, from) {
  const groups = []
  for (const [d, label] of Object.entries(events).filter(([d]) => d >= from).sort()) {
    const last = groups[groups.length - 1]
    if (last && last.label === label && nextDay(last.end) === d) last.end = d
    else groups.push({ start: d, end: d, label })
  }
  return groups
}

export default function VisitList({ books, cfg, isAdmin, userId, onChange, saveConfig }) {
  const today = iso(new Date())
  const upcoming = books.filter((b) => b.end_date >= today)
  const groups = groupEvents(cfg.events, today)

  async function removeBooking(id) {
    if (!confirm('Remove this booking?')) return
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) alert(error.message)
    await onChange()
  }

  async function removeEvent(g) {
    if (!confirm('Remove this key date?')) return
    const ev = { ...cfg.events }
    daysBetween(g.start, g.end).forEach((d) => delete ev[d])
    await saveConfig({ events: ev })
  }

  return (
    <>
      {upcoming.length ? (
        upcoming.map((b) => (
          <div className="item" key={b.id}>
            <div>
              <b>{b.name}</b>{' '}
              <span className="mute">
                {fmt(b.start_date)} → {fmt(b.end_date)}
              </span>
              {b.note && <div className="mute">{b.note}</div>}
            </div>
            {(isAdmin || b.user_id === userId) && (
              <button className="d" onClick={() => removeBooking(b.id)}>
                Remove
              </button>
            )}
          </div>
        ))
      ) : (
        <span className="mute">No visits booked yet. Be the first!</span>
      )}
      {groups.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <b>Key dates</b>
          {groups.map((g) => (
            <div className="item" key={g.start}>
              <div>
                <span className="tag">★</span> {g.label}
                <div className="mute">
                  {fmt(g.start)}
                  {g.end !== g.start ? ' – ' + fmt(g.end) : ''}
                </div>
              </div>
              {isAdmin && (
                <button className="d" onClick={() => removeEvent(g)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
