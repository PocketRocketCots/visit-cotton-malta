import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysBetween, fmt } from '../lib/dates'

// The booking card. Dates are picked on the calendar passed in as `children`.
export default function BookingForm({ start, end, cfg, name, onBooked, children }) {
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState(null) // { text, ok }

  async function submit() {
    setMsg(null)
    if (!start || !end) return setMsg({ text: 'Tap your arrival day on the calendar, then your leaving day.' })
    if (end < start) return setMsg({ text: 'Leaving date is before arrival.' })
    const clash = daysBetween(start, end).find((d) => cfg.blocked.includes(d))
    if (clash) return setMsg({ text: fmt(clash) + ' isn’t available. Try other dates.' })

    const { data, error } = await supabase
      .from('bookings')
      .insert({ name, start_date: start, end_date: end, note: note.trim() })
      .select()
      .single()
    if (error) return setMsg({ text: 'Couldn’t book: ' + error.message })
    supabase.functions.invoke('notify', { body: { id: data.id } }) // sends the confirmation email
    setNote('')
    setMsg({ ok: true, text: 'Booked! A confirmation email is on its way.' })
    await onBooked()
  }

  return (
    <div className="glass-card">
      <div className="glass-head">
        <div>
          <div className="glass-title">Cotton’s Sea-View Apartment</div>
          <div className="glass-sub">St Paul’s Bay, Malta</div>
        </div>
        <span className="glass-badge" aria-hidden="true">
          ✦
        </span>
      </div>
      <div className="glass-cal" aria-live="polite">
        {children}
      </div>
      <label htmlFor="bt">Note (optional)</label>
      <input
        id="bt"
        maxLength={120}
        placeholder="Bringing the kids, need a sofa…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="glass-price">
        <span>
          <b>Free</b> / night
        </span>
        <span>Guinness appreciated</span>
      </div>
      <div className={'msg' + (msg?.ok ? ' ok' : '')}>{msg?.text}</div>
      <button className="glass-btn" onClick={submit}>
        Reserve
      </button>
    </div>
  )
}
