// One palette for every pixel-art scene (home map, Split the G bar, Book a trip apartment),
// taken from the Book a trip apartment view: a clear daytime Mediterranean sky and deep blue sea.
// Matching CSS tokens live in index.css.

// Daytime sky, top to horizon: [relative row (0 = top of the sky), colour].
export const SKY = [
  [0, '#3f8fd6'],
  [0.25, '#5aa3e0'],
  [0.5, '#78b6e8'],
  [0.72, '#98c9ef'],
  [0.88, '#b8dbf3'],
]

// Sea, horizon to shore (relative depth 0 → 1).
export const SEA = [
  [0, '#1d5fa8'],
  [0.2, '#2370b6'],
  [0.45, '#2a83c3'],
  [0.7, '#3196cf'],
]

export const SEA_FLAT = '#2a83c3' // open sea on the map
export const SEA_DOT = '#4aa3dc' // dotted grid on the map
export const SEA_SHADOW = '#1d5fa8' // shadow under the islands
export const WAVE = '#8fd0f0' // moving wave highlights
export const SUN = ['#ffe9a3', '#fffbe0'] // outer, inner
export const GLINT = '#e8f6ff' // sunlight glitter on the water
export const DISTANT_LAND = '#9bb7c9' // islands on the horizon, hazy blue-grey

// Turn relative stops into absolute pixel rows between top and bottom.
export const rows = (stops, top, bottom) => stops.map(([t, c]) => [Math.round(top + t * (bottom - top)), c])
