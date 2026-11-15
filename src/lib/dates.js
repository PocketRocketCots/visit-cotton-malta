// All dates are handled as "YYYY-MM-DD" strings in UTC so they never shift with the viewer's time zone.
export const iso = (d) => d.toISOString().slice(0, 10)
export const toDate = (s) => new Date(s + 'T00:00:00Z')
export const fmt = (s) =>
  toDate(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
export const nextDay = (s) => iso(new Date(toDate(s).getTime() + 864e5))

// Every day from a to b inclusive.
export function daysBetween(a, b) {
  const out = []
  for (let d = a; d <= b; d = nextDay(d)) out.push(d)
  return out
}

// Great-circle distance in km.
export function haversineKm(lat1, lon1, lat2, lon2) {
  const r = (x) => (x * Math.PI) / 180
  const q =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(q))
}
