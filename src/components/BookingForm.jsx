import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysBetween, fmt } from '../lib/dates'

export default function BookingForm({ start, end, setStart, setEnd, cfg, name, onBooked }) {
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState(null) // { text, ok }

  async function submit() {
    setMsg(null)
    if (!start || !end) return setMsg({ text: 'Please choose both dates.' })
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
    <div className="card">
      <h2>Book a visit</h2>
      <div className="row">
        <div>
          <label htmlFor="bs">Arriving</label>
          <input id="bs" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label htmlFor="be">Leaving</label>
          <input id="be" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <label htmlFor="bt">Note (optional)</label>
      <input
        id="bt"
        maxLength={120}
        placeholder="Bringing the kids, need a sofa…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className={'msg' + (msg?.ok ? ' ok' : '')}>{msg?.text}</div>
      <button className="p" onClick={submit}>
        Book it
      </button>
    </div>
  )
}
