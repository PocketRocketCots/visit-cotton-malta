// Supabase Edge Function: emails a logged-in player their "free pint" voucher after a perfect Split the G.
// - Only emails the player's own account address (taken from their login, never from the request).
// - One free pint per person: the pint_claims table records who has already been sent one.
// Secrets used: RESEND_API_KEY and FROM_EMAIL (the same ones the notify function uses).
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const MESSAGE =
  'WOW, you split the G perfectly, go you! You can use this email to claim a free pint of Guinness from your host upon arrival'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const {
    data: { user },
  } = await admin.auth.getUser(token)
  if (!user?.email) return json({ error: 'Please log in first.' }, 401)

  // Record the claim first; a second claim by the same person hits the primary key and is refused.
  const { error: claimError } = await admin.from('pint_claims').insert({ user_id: user.id })
  if (claimError) {
    if (claimError.code === '23505') return json({ already: true })
    return json({ error: claimError.message }, 500)
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('FROM_EMAIL') ?? 'Visit Cotton in Malta <onboarding@resend.dev>', // same sender as notify
      to: user.email,
      subject: 'You split the G! 🍀 Your free pint awaits',
      text: MESSAGE,
      html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#43112e">
        <h1 style="color:#ff2d95;margin:0 0 12px">You split the G! 🍀</h1>
        <p>${MESSAGE}</p>
        <p style="color:#6d3a55">See you in Malta! Sláinte!</p>
      </div>`,
    }),
  })

  if (!res.ok) {
    // Let them try again later if the email didn't go out
    await admin.from('pint_claims').delete().eq('user_id', user.id)
    return json({ error: 'The email could not be sent.' }, 502)
  }
  return json({ sent: true })
})
