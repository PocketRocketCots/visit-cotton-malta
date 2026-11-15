import { useEffect, useRef, useState } from 'react'
import { SEA_DOT, SEA_FLAT, SEA_SHADOW } from '../lib/palette'

// Pixel-art map of the Maltese islands (Malta, Gozo, Comino), drawn on a 320×240 canvas
// and scaled up with crisp pixels. Cotton stands waving in St Paul's Bay.

const W = 320
const H = 240
const FRAME_MS = 180

// Simple map projection: [lat, lon] -> canvas pixels.
const toXY = ([lat, lon]) => [38 + 594.6 * (lon - 14.17), 13 + 735 * (36.09 - lat)]

// Rough coastlines, clockwise.
const MALTA = [
  [35.987, 14.329], [35.995, 14.34], [35.999, 14.352], [35.99, 14.37], [35.978, 14.372], [35.968, 14.36],
  [35.966, 14.372], [35.972, 14.385], [35.968, 14.398], [35.957, 14.396], [35.95, 14.393], [35.951, 14.405],
  [35.957, 14.415], [35.963, 14.42], [35.952, 14.432], [35.952, 14.442], [35.945, 14.455], [35.932, 14.475],
  [35.922, 14.492], [35.913, 14.505], [35.903, 14.507], [35.905, 14.516], [35.893, 14.512], [35.89, 14.522],
  [35.896, 14.53], [35.885, 14.548], [35.87, 14.56], [35.855, 14.566], [35.845, 14.552], [35.838, 14.565],
  [35.825, 14.563], [35.828, 14.545], [35.82, 14.535], [35.812, 14.522], [35.815, 14.5], [35.822, 14.47],
  [35.82, 14.455], [35.83, 14.43], [35.85, 14.4], [35.868, 14.38], [35.89, 14.355], [35.905, 14.34],
  [35.922, 14.335], [35.935, 14.34], [35.95, 14.335], [35.962, 14.338], [35.975, 14.33],
].map(toXY)
const GOZO = [
  [36.077, 14.195], [36.083, 14.218], [36.08, 14.245], [36.076, 14.262], [36.072, 14.285], [36.062, 14.3],
  [36.05, 14.322], [36.037, 14.336], [36.025, 14.315], [36.022, 14.297], [36.022, 14.27], [36.027, 14.245],
  [36.03, 14.215], [36.04, 14.195], [36.05, 14.185], [36.065, 14.185],
].map(toXY)
const COMINO = [
  [36.016, 14.322], [36.017, 14.337], [36.012, 14.348], [36.003, 14.345], [35.999, 14.332], [36.006, 14.322],
].map(toXY)

// Places
const P = {
  cirkewwa: toXY([35.987, 14.329]),
  mellieha: toXY([35.957, 14.366]),
  stpauls: toXY([35.952, 14.41]),
  mosta: toXY([35.909, 14.426]),
  mdina: toXY([35.886, 14.403]),
  valletta: toXY([35.899, 14.513]),
  airport: toXY([35.857, 14.477]),
  marsaxlokk: toXY([35.842, 14.543]),
  popeye: toXY([35.961, 14.345]),
  goldenbay: toXY([35.934, 14.343]),
  victoria: toXY([36.046, 14.239]),
  mgarr: toXY([36.025, 14.299]),
  marsalforn: toXY([36.072, 14.26]),
  lighthouse: toXY([36.073, 14.218]),
  lagoon: toXY([36.012, 14.326]),
  ferryA: toXY([35.993, 14.322]),
  ferryB: toXY([36.019, 14.302]),
}

// Cotton's feet sit in St Paul's Bay.
const AV_X = Math.round(P.stpauls[0]) - 6
const AV_Y = Math.round(P.stpauls[1]) - 35

// Big script island names, like a tourist map
// `group` is the island (1 Malta, 2 Gozo, 3 Comino): its labels only fade in while that island is hovered or tapped.
const NAMES = [
  { text: 'Gozo', at: toXY([36.003, 14.212]), group: 2 },
  { text: 'Comino', at: toXY([36.03, 14.372]), small: true, group: 3 },
  { text: 'Malta', at: toXY([35.875, 14.322]), big: true, group: 1 },
]

// A point just above a building's top, so its label doesn't cover it.
const above = (ll, up, right = 0) => {
  const [x, y] = toXY(ll)
  return [x + right, y - up]
}

// Place labels: `sub` is a short description; `minor` labels hide on small screens.
const LABELS = [
  { text: '♥ St Paul’s Bay', sub: 'Cotton lives here!', at: [AV_X + 6, AV_Y - 3], you: true },
  { text: 'Mdina', sub: 'The Silent City', at: above([35.886, 14.403], 8), group: 1 },
  { text: 'Valletta', sub: 'Fortified capital', at: toXY([35.899, 14.537]), group: 1 },
  { text: 'Marsaxlokk', sub: 'Fishing village', at: toXY([35.842, 14.545]), side: 'left', group: 1 },
  { text: 'Blue Lagoon', sub: 'Turquoise waters', at: toXY([36.009, 14.321]), side: 'left', group: 3 },
  { text: 'Victoria', sub: 'The Citadel', at: above([36.046, 14.239], 11), minor: true, group: 2 },
  { text: 'Ta’ Pinu', sub: 'Basilica', at: above([36.062, 14.214], 15, 2), minor: true, group: 2 },
  { text: 'Dwejra', sub: 'Rock arch', at: above([36.06, 14.18], 11), minor: true, group: 2 },
  { text: 'Ramla Bay', sub: 'Red-sand beach', at: toXY([36.075, 14.284]), minor: true, group: 2 },
  { text: 'Golden Bay', sub: 'Sandy beach', at: toXY([35.934, 14.338]), side: 'left', minor: true, group: 1 },
  { text: 'Rabat', sub: 'Catacombs', at: toXY([35.87, 14.384]), side: 'left', minor: true, group: 1 },
  { text: 'Dingli Cliffs', sub: 'Sea caves & views', at: toXY([35.852, 14.39]), side: 'left', minor: true, group: 1 },
  { text: 'St Julian’s', sub: 'Nightlife', at: above([35.922, 14.488], 19), minor: true, group: 1 },
  { text: 'Blue Grotto', sub: 'Sea caves', at: toXY([35.818, 14.45]), side: 'left', minor: true, group: 1 },
]

// Which island is under (or right next to) a map point: 0 = sea
const NEAR = [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, 4], [4, -4], [-4, -4], [10, 0], [-10, 0], [0, 10], [0, -10], [7, 7], [-7, 7], [7, -7], [-7, -7]]
function islandNear(base, x, y) {
  for (const [dx, dy] of NEAR) {
    const r = base.region(Math.round(x + dx), Math.round(y + dy))
    if (r) return r
  }
  return 0
}

function rng(seed) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296
}

function inside(poly, x, y) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

// Land colours: [base, light speck, dark speck]
const ZONES = {
  malta: ['#f0cf92', '#f7e0b0', '#dfb878'],
  gozo: ['#8bd86a', '#b4ec98', '#62b947'],
  comino: ['#c7a3ff', '#ddc6ff', '#a57ef0'],
}
const zoneOf = (region) => (region === 2 ? ZONES.gozo : region === 3 ? ZONES.comino : ZONES.malta)

const STONE = '#f3e2b3' // Maltese limestone
const DOOR = '#7a5530'

// A typical Maltese parish church: front with two bell towers and a dome behind.
function church(px, x, y, dome = '#8f9bb5', stone = STONE) {
  px(x - 2, y - 9, dome, 4, 2)
  px(x - 1, y - 10, dome, 2, 1)
  px(x - 2, y - 9, '#ffffff33', 1, 2)
  px(x - 1, y - 11, stone, 2, 1)
  px(x - 4, y - 5, stone, 8, 5)
  px(x - 3, y - 6, stone, 6, 1)
  px(x - 1, y - 7, stone, 2, 1)
  px(x - 6, y - 9, stone, 2, 9)
  px(x + 4, y - 9, stone, 2, 9)
  px(x - 6, y - 10, dome, 2, 1)
  px(x + 4, y - 10, dome, 2, 1)
  px(x - 6, y - 7, DOOR)
  px(x + 5, y - 7, DOOR)
  px(x - 1, y - 2, DOOR, 2, 2)
  px(x - 1, y - 5, DOOR, 2, 1)
}

// A squat coastal watchtower with corner turrets.
function watchtower(px, x, y, stone = '#e9c886') {
  px(x - 3, y - 6, stone, 6, 6)
  px(x - 4, y - 7, stone, 2, 2)
  px(x + 2, y - 7, stone, 2, 2)
  px(x - 3, y - 6, '#cfa860', 1, 6)
  px(x - 1, y - 2, DOOR, 2, 2)
  px(x - 1, y - 5, DOOR)
}

const SEA = SEA_FLAT // shared with the other scenes (src/lib/palette.js)
const OUTLINE = '#5a2340'

// Everything that never moves is drawn once into an off-screen canvas.
function buildStatic() {
  const mask = new Uint8Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const cx = x + 0.5
      const cy = y + 0.5
      mask[y * W + x] = inside(MALTA, cx, cy) ? 1 : inside(GOZO, cx, cy) ? 2 : inside(COMINO, cx, cy) ? 3 : 0
    }
  const land = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] > 0

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  let px = makePx(ctx)

  // Sea with a dotted grid, and the Blue Lagoon's turquoise shallows
  px(0, 0, SEA, W, H)
  for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) px(x, y, SEA_DOT)
  const [lx, ly] = P.lagoon
  px(lx - 6, ly - 3, '#6fe3ee', 10, 6)
  px(lx - 5, ly - 4, '#6fe3ee', 8, 8)

  // Raised-island look: cliff band and shadow beneath each coast
  const coast = []
  const cliffFaces = []
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (land(x, y)) continue
      // Dingli's coast gets tall, striped cliff faces; everywhere else a low cliff band
      const tall = x >= 150 && x <= 200 && y >= 170 && y <= 218
      const depth = tall ? 5 : 2
      let d = 0
      for (let k = 1; k <= depth + 2; k++)
        if (land(x, y - k)) {
          d = k
          break
        }
      if (d && d <= depth) {
        px(x, y, tall ? ((x + y) % 4 === 0 ? '#8a4f25' : d <= 2 ? '#d08844' : '#b56a33') : d === 1 ? '#d08844' : '#a8622e')
        if (tall && d === 3) cliffFaces.push([x, y])
      } else if (d) px(x, y, SEA_SHADOW)
      if (land(x - 1, y) || land(x + 1, y) || land(x, y + 1)) coast.push([x, y])
    }

  // Land, with texture and a dark outline
  const R = rng(11)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const region = mask[y * W + x]
      if (!region) continue
      const [base, light, dark] = zoneOf(region)
      const edge = !land(x - 1, y) || !land(x + 1, y) || !land(x, y - 1) || !land(x, y + 1)
      const r = R()
      px(x, y, edge ? OUTLINE : r < 0.06 ? light : r < 0.1 ? dark : base)
    }

  // Roads
  const road = (a, b) => line(px, a, b, '#fff3d6', land)
  road(P.cirkewwa, P.mellieha)
  road(P.mellieha, P.stpauls)
  road(P.stpauls, P.mosta)
  road(P.mosta, P.valletta)
  road(P.mosta, P.mdina)
  road(P.valletta, P.airport)
  road(P.airport, P.marsaxlokk)
  road(P.mgarr, P.victoria)
  road(P.victoria, P.marsalforn)

  // Trees
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(R() * W)
    const y = Math.floor(R() * H)
    if (!land(x - 1, y - 1) || !land(x + 2, y + 2) || !land(x - 1, y + 2) || !land(x + 2, y - 1)) continue
    px(x, y, '#2f9e57', 2, 2)
    px(x, y, '#59c97a')
  }

  // Towns: clusters of flat-roofed limestone houses with coloured Maltese balconies
  const BALCONY = ['#2f7d4f', '#2a5cc7', '#c8432f', '#2f7d4f', '#e8a33a']
  const town = (ll, n, r) => {
    const [cx, cy] = toXY(ll)
    let placed = 0
    for (let tries = 0; placed < n && tries < n * 12; tries++) {
      const hx = Math.round(cx + (R() * 2 - 1) * r)
      const hy = Math.round(cy + (R() * 2 - 1) * r * 0.7)
      if (!land(hx - 1, hy - 1) || !land(hx + 4, hy + 4)) continue
      px(hx, hy, '#fff6e2', 3, 2)
      px(hx, hy + 2, '#c99f62', 3, 1)
      px(hx + 1, hy + 1, BALCONY[Math.floor(R() * BALCONY.length)])
      placed++
    }
  }
  town([35.912, 14.5], 12, 7) // Sliema & St Julian's
  town([35.885, 14.475], 14, 8) // Birkirkara & Qormi
  town([35.868, 14.512], 10, 6) // Paola & Tarxien
  town([35.878, 14.395], 7, 5) // Rabat
  town([35.955, 14.36], 7, 5) // Mellieħa
  town([35.946, 14.433], 6, 4) // Buġibba & Qawra
  town([35.862, 14.533], 8, 5) // Żabbar & Żejtun
  town([36.044, 14.24], 9, 6) // Victoria
  town([36.03, 14.292], 5, 4) // Mġarr, Gozo

  // Ramla Bay's famous red sand
  {
    const [cx, cy] = toXY([36.064, 14.284])
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -7; dx <= 7; dx++)
        if ((dx * dx) / 49 + (dy * dy) / 9 <= 1 && land(cx + dx, cy + dy) && land(cx + dx, cy + dy - 1))
          px(cx + dx, cy + dy, (dx + dy) % 3 ? '#e2733f' : '#f0915c')
  }

  // Sea caves in the Dingli cliff faces
  cliffFaces.forEach(([x, y], i) => {
    if (i % 9 !== 4) return
    px(x, y - 1, '#3a2416', 2, 3)
    px(x - 1, y, '#3a2416', 1, 2)
  })

  // Landmarks go on their own layer so each gets a crisp dark outline (see the end)
  const layer = document.createElement('canvas')
  layer.width = W
  layer.height = H
  const lctx = layer.getContext('2d')
  px = makePx(lctx)
  const at = ([x, y]) => [Math.round(x), Math.round(y)]
  { // Valletta: honey-coloured city with a big dome
    const [x, y] = at(P.valletta)
    px(x - 6, y - 3, '#f3e2b3', 12, 6)
    for (let i = 0; i < 6; i++) px(x - 6 + i * 2, y - 4, i % 2 ? '#e24f74' : '#f3e2b3', 2, 1)
    px(x - 1, y - 8, '#7f8fb0', 4, 1)
    px(x - 2, y - 7, '#7f8fb0', 6, 3)
    px(x - 1, y - 7, '#a9b8d6', 1, 2)
    px(x, y - 10, '#ffd23f', 1, 2)
    px(x + 3, y - 7, '#f3e2b3', 2, 3) // the Anglican cathedral's tall spire
    px(x + 4, y - 11, '#f3e2b3', 1, 4)
    for (let i = 0; i < 5; i++) px(x - 5 + i * 2, y, '#7a5530', 1, 2)
  }
  { // Mdina: walled city on the hill
    const [x, y] = at(P.mdina)
    px(x - 5, y - 3, '#e9c886', 10, 6)
    for (let i = 0; i < 5; i++) px(x - 5 + i * 2, y - 4, '#e9c886')
    px(x - 1, y - 7, '#f6e3b0', 1, 4)
    px(x + 2, y - 7, '#f6e3b0', 1, 4)
    px(x, y - 6, '#c9a2ff', 2, 3)
    px(x - 1, y + 1, '#7a5530', 2, 2)
  }
  { // Mosta Rotunda: huge dome, columned portico, twin bell towers
    const [x, y] = at(P.mosta)
    px(x - 7, y - 7, '#f3e2b3', 2, 7)
    px(x + 5, y - 7, '#f3e2b3', 2, 7)
    px(x - 7, y - 8, '#7f8fb0', 2, 1)
    px(x + 5, y - 8, '#7f8fb0', 2, 1)
    px(x - 4, y - 4, '#f3e2b3', 8, 2)
    px(x - 4, y - 7, '#7f8fb0', 8, 3)
    px(x - 3, y - 8, '#7f8fb0', 6, 1)
    px(x - 3, y - 7, '#a9b8d6', 2, 1)
    px(x - 1, y - 10, '#f3e2b3', 2, 2)
    px(x - 5, y - 2, '#f3e2b3', 10, 3)
    for (let i = 0; i < 5; i++) px(x - 4 + i * 2, y - 2, '#c9a978', 1, 3)
  }
  { // St Agatha's Red Tower, Mellieħa: red fort with four corner turrets
    const [x, y] = at(toXY([35.976, 14.343]))
    const red = '#c8432f', dark = '#9b2f22'
    px(x - 4, y - 6, red, 8, 7)
    px(x - 5, y - 8, red, 3, 3)
    px(x + 2, y - 8, red, 3, 3)
    px(x - 5, y - 1, red, 3, 2)
    px(x + 2, y - 1, red, 3, 2)
    px(x - 5, y - 8, dark, 1, 3)
    px(x - 5, y - 1, dark, 1, 2)
    px(x - 4, y - 5, dark, 1, 6)
    px(x - 1, y - 7, red, 2, 1)
    px(x - 1, y - 2, '#5a1e16', 2, 2)
    px(x - 1, y - 5, '#5a1e16')
    px(x + 1, y - 5, '#5a1e16')
  }
  { // Portomaso tower, St Julian's: tall blue glass skyscraper
    const [x, y] = at(toXY([35.922, 14.488]))
    px(x - 2, y - 14, '#5b8fd6', 4, 14)
    px(x + 1, y - 14, '#3f6fb3', 1, 14)
    for (let r = y - 13; r < y; r += 2) px(x - 2, r, '#a9cdf5', 3, 1)
    px(x - 1, y - 16, '#5b8fd6', 2, 2)
    px(x, y - 18, '#dfe9f5', 1, 2)
    px(x + 3, y - 5, '#f3e2b3', 4, 5)
    px(x + 3, y - 6, '#e24f74', 4, 1)
  }
  { // Dingli radar: white golf-ball dome on the cliffs
    const [x, y] = at(toXY([35.861, 14.382]))
    px(x - 3, y - 2, '#e9e3d6', 6, 2)
    px(x, y - 4, '#cfd6df', 1, 2)
    px(x - 1, y - 9, '#ffffff', 3, 1)
    px(x - 2, y - 8, '#ffffff', 5, 3)
    px(x - 1, y - 5, '#ffffff', 3, 1)
    px(x + 2, y - 8, '#d7dee8', 1, 3)
    px(x + 1, y - 5, '#d7dee8')
  }
  { // Ħaġar Qim: prehistoric megalithic temple stones
    const [x, y] = at(toXY([35.828, 14.442]))
    const st = '#d9c79a', sh = '#a8956a'
    px(x - 6, y - 1, '#e8d7a8', 12, 2)
    px(x - 5, y - 4, st, 2, 4)
    px(x - 2, y - 5, st, 2, 5)
    px(x + 1, y - 5, st, 2, 5)
    px(x - 2, y - 6, '#cbb88a', 5, 1)
    px(x + 4, y - 3, st, 2, 3)
    ;[[-4, -4], [-1, -5], [2, -5], [5, -3]].forEach(([dx, dy]) => px(x + dx, y + dy, sh, 1, -dy))
  }
  { // Comino: St Mary's Tower, a squat honey-stone tower
    const [x, y] = at(toXY([36.01, 14.334]))
    px(x - 3, y - 6, '#e9c886', 6, 6)
    px(x - 4, y - 7, '#e9c886', 2, 2)
    px(x + 2, y - 7, '#e9c886', 2, 2)
    px(x - 3, y - 6, '#cfa860', 1, 6)
    px(x - 1, y - 2, '#7a5530', 2, 2)
    px(x - 1, y - 5, '#7a5530')
  }
  { // Ta' Pinu Basilica, Gozo: church front with a tall separate bell tower
    const [x, y] = at(toXY([36.062, 14.214]))
    const c = '#f2dfae', d = '#c9a26a'
    px(x - 4, y - 6, c, 8, 6)
    px(x - 3, y - 7, c, 6, 1)
    px(x - 2, y - 8, c, 4, 1)
    px(x - 1, y - 9, c, 2, 1)
    px(x - 4, y - 6, d, 1, 6)
    px(x - 1, y - 6, '#7a5530', 2, 1)
    px(x - 1, y - 2, '#7a5530', 2, 2)
    px(x + 5, y - 12, c, 3, 12)
    px(x + 5, y - 12, d, 1, 12)
    px(x + 6, y - 14, d, 1, 2)
    px(x + 6, y - 10, '#7a5530')
    px(x + 6, y - 7, '#7a5530')
  }
  { // Ġgantija temples, Gozo: clover-shaped ring of giant stones
    const [x, y] = at(toXY([36.047, 14.272]))
    px(x - 3, y - 3, '#e8d7a8', 7, 3)
    ;['.##.##.', '#..#..#', '#.....#', '.#...#.', '..#.#..'].forEach((row, dy) =>
      [...row].forEach((v, dx) => v === '#' && px(x - 3 + dx, y - 5 + dy, (dx + dy) % 2 ? '#a8956a' : '#d0c19a')),
    )
  }
  { // Xewkija Rotunda, Gozo: enormous dome on a round drum
    const [x, y] = at(toXY([36.032, 14.258]))
    px(x - 6, y, '#e3cd98', 12, 1)
    px(x - 5, y - 3, '#f2dfae', 10, 3)
    for (let i = 0; i < 4; i++) px(x - 4 + i * 3, y - 2, '#c9a978', 1, 2)
    px(x - 4, y - 5, '#8f9bb5', 8, 2)
    px(x - 3, y - 7, '#8f9bb5', 6, 2)
    px(x - 2, y - 8, '#8f9bb5', 4, 1)
    px(x - 3, y - 6, '#c3cde3', 1, 2)
    px(x - 1, y - 10, '#f2dfae', 2, 2)
  }
  { // Gozo Citadel
    const [x, y] = at(P.victoria)
    px(x - 6, y - 3, '#e9c886', 12, 6)
    for (let i = 0; i < 6; i++) px(x - 6 + i * 2, y - 4, '#e9c886')
    px(x - 1, y - 8, '#f6e3b0', 3, 5)
    px(x, y - 10, '#f6e3b0', 1, 2)
    px(x - 4, y + 1, '#7a5530', 2, 2)
  }
  { // Popeye Village: colourful huts
    const [x, y] = at(P.popeye)
    ;['#ff5f5f', '#4fb3ff', '#ffd23f', '#7ed957'].forEach((c, i) => {
      px(x - 4 + i * 3, y - 2 + (i % 2), c, 2, 2)
      px(x - 4 + i * 3, y - 3 + (i % 2), '#7a5530', 2, 1)
    })
  }
  { // Golden Bay sand
    const [x, y] = at(P.goldenbay)
    px(x - 1, y - 3, '#fff0b8', 3, 6)
  }
  { // Airport runway
    const [x, y] = at(P.airport)
    px(x - 8, y - 1, '#8c8f99', 16, 3)
    for (let i = 0; i < 4; i++) px(x - 6 + i * 4, y, '#ffffff', 2, 1)
  }
  { // Gozo lighthouse
    const [x, y] = at(P.lighthouse)
    px(x, y - 6, '#ffffff', 2, 6)
    px(x, y - 4, '#e23b3b', 2, 1)
    px(x - 1, y - 7, '#ffd23f', 4, 1)
  }

  // ---- More landmarks ----
  // Parish churches, each with its own dome colour
  church(px, ...at(toXY([35.957, 14.362])), '#8f9bb5') // Mellieħa
  church(px, ...at(toXY([35.896, 14.468])), '#c8432f') // Birkirkara basilica
  church(px, ...at(toXY([35.872, 14.441])), '#8f9bb5') // Żebbuġ
  church(px, ...at(toXY([35.854, 14.437])), '#4f9a7a') // Siġġiewi
  church(px, ...at(toXY([35.831, 14.474])), '#c8432f') // Żurrieq
  church(px, ...at(toXY([35.873, 14.507])), '#7f8fb0') // Paola, Christ the King
  church(px, ...at(toXY([35.876, 14.536])), '#8f9bb5') // Żabbar sanctuary
  church(px, ...at(toXY([35.858, 14.53])), '#c8432f') // Żejtun, St Catherine
  church(px, ...at(toXY([35.876, 14.397])), '#8f9bb5') // Rabat, St Paul's
  church(px, ...at(toXY([36.038, 14.293])), '#c8432f') // Nadur, Gozo

  { // Mġarr "Egg Church": tall egg-shaped dome
    const [x, y] = at(toXY([35.92, 14.367]))
    const egg = '#e4ddcb', shade = '#bdb49c'
    px(x - 4, y - 4, STONE, 8, 4)
    px(x - 1, y - 2, DOOR, 2, 2)
    px(x - 1, y - 12, egg, 2, 1)
    px(x - 2, y - 11, egg, 4, 6)
    px(x - 1, y - 5, egg, 2, 1)
    px(x + 1, y - 11, shade, 1, 6)
    px(x, y - 13, STONE)
    px(x + 4, y - 9, STONE, 2, 9)
    px(x + 4, y - 10, '#8f9bb5', 2, 1)
  }
  { // Verdala Palace: square palace with four corner bastions and a raised centre
    const [x, y] = at(toXY([35.862, 14.405]))
    px(x - 5, y - 6, STONE, 10, 6)
    ;[[-6, -8], [3, -8], [-6, -1], [3, -1]].forEach(([dx, dy]) => px(x + dx, y + dy, '#e9c886', 3, dy < 0 ? 3 : 2))
    px(x - 2, y - 9, '#e9c886', 4, 3)
    ;[-3, -1, 1, 3].forEach((dx) => px(x + dx, y - 4, DOOR))
    px(x - 1, y - 2, DOOR, 2, 2)
    ;[[-9, 1], [8, 0], [-8, -4], [9, -6]].forEach(([dx, dy]) => px(x + dx, y + dy, '#2f9e57', 2, 2)) // Buskett woods
  }
  { // Selmun Palace: fortified palace with pointed corner turrets
    const [x, y] = at(toXY([35.963, 14.383]))
    px(x - 4, y - 5, STONE, 8, 5)
    ;[-5, 3].forEach((dx) => {
      px(x + dx, y - 6, '#e9c886', 2, 6)
      px(x + dx, y - 7, '#c9a978', 2, 1)
    })
    px(x - 1, y - 7, STONE, 2, 2)
    px(x - 1, y - 2, DOOR, 2, 2)
    px(x - 3, y - 4, DOOR)
    px(x + 2, y - 4, DOOR)
  }
  { // San Anton Palace: long palace with a tall tower and formal gardens
    const [x, y] = at(toXY([35.891, 14.444]))
    px(x - 6, y - 4, STONE, 12, 4)
    px(x - 1, y - 10, STONE, 3, 6)
    px(x - 2, y - 11, '#e9c886', 5, 1)
    ;[-5, -3, 3, 5].forEach((dx) => px(x + dx, y - 3, DOOR))
    px(x, y - 8, DOOR)
    px(x - 6, y + 1, '#3fae63', 12, 2)
    px(x, y + 1, '#fff3d6', 1, 2)
  }
  { // Fort St Angelo, Birgu: stepped bastion walls rising to a little chapel
    const [x, y] = at(toXY([35.892, 14.522]))
    px(x - 6, y - 2, '#e9c886', 12, 3)
    px(x - 4, y - 5, STONE, 8, 3)
    px(x - 2, y - 7, '#e9c886', 4, 2)
    px(x - 6, y - 2, '#cfa860', 1, 3)
    px(x - 4, y - 5, '#cfa860', 1, 3)
    px(x, y - 9, '#8f9bb5', 1, 2)
    px(x + 2, y - 10, '#ffffff', 1, 3)
    px(x + 3, y - 10, '#cf142b', 2, 2)
  }
  { // Blue Grotto: natural rock arch over turquoise water
    const [x, y] = at(toXY([35.817, 14.455]))
    const rock = '#cfa36a'
    px(x - 2, y - 4, '#6fe3ee', 4, 5)
    px(x - 4, y - 6, rock, 8, 2)
    px(x - 4, y - 4, rock, 2, 5)
    px(x + 2, y - 4, rock, 2, 5)
    px(x - 4, y - 6, '#a67c45', 1, 7)
  }
  { // Fungus Rock, Dwejra: tall sea stack
    const [x, y] = at(toXY([36.049, 14.178]))
    px(x - 2, y - 6, '#c49a5e', 4, 7)
    px(x - 3, y - 8, '#c49a5e', 6, 2)
    px(x - 2, y - 9, '#d9b67a', 4, 1)
    px(x + 1, y - 6, '#a67c45', 1, 7)
    px(x - 3, y + 1, '#e8fbff', 6, 1)
  }
  { // Xwejni salt pans, Gozo: a grid of shallow square pools
    const [x, y] = at(toXY([36.078, 14.235]))
    px(x - 4, y - 3, '#d9b67a', 9, 6)
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) px(x - 3 + c * 3, y - 2 + r * 3, '#cfeff7', 2, 2)
  }
  { // Fort Chambray, Gozo: star-shaped bastion fort
    const [x, y] = at(toXY([36.027, 14.288]))
    ;[2, 6, 8, 6, 2].forEach((w, i) => px(x - w / 2, y - 6 + i, '#e9c886', w, 1))
    px(x - 1, y - 4, '#8bd86a', 2, 2)
  }
  { // Delimara lighthouse
    const [x, y] = at(toXY([35.827, 14.562]))
    px(x, y - 8, '#ffffff', 2, 8)
    px(x, y - 6, '#e23b3b', 2, 1)
    px(x, y - 3, '#e23b3b', 2, 1)
    px(x - 1, y - 9, '#ffd23f', 4, 1)
  }
  { // Airport control tower
    const [x, y] = at(toXY([35.853, 14.48]))
    px(x, y - 8, '#e9e3d6', 2, 8)
    px(x - 1, y - 10, '#5b8fd6', 4, 2)
    px(x - 1, y - 11, '#e9e3d6', 4, 1)
  }
  watchtower(px, ...at(toXY([35.929, 14.344]))) // Għajn Tuffieħa tower
  watchtower(px, ...at(toXY([36.028, 14.214]))) // Xlendi tower

  { // Dwejra rock arch, Gozo: a great stone arch standing in the sea
    const [x, y] = at(toXY([36.06, 14.18]))
    const rock = '#c49a5e', dark = '#a67c45'
    px(x - 6, y - 9, rock, 12, 3)
    px(x - 5, y - 10, '#d9b67a', 9, 1)
    px(x - 6, y - 6, rock, 3, 7)
    px(x + 3, y - 6, rock, 3, 7)
    px(x - 6, y - 9, dark, 1, 10)
    px(x + 5, y - 6, dark, 1, 7)
    px(x - 7, y + 1, '#e8fbff', 5, 1)
    px(x + 2, y + 1, '#e8fbff', 5, 1)
  }
  { // Rabat catacombs: rocky mound with an arched cave entrance
    const [x, y] = at(toXY([35.87, 14.391]))
    const rock = '#c9a46a'
    px(x - 4, y - 3, rock, 8, 3)
    px(x - 3, y - 4, rock, 6, 1)
    px(x - 2, y - 5, rock, 4, 1)
    px(x - 1, y - 3, '#3a2416', 2, 3)
    px(x - 2, y - 2, '#3a2416', 1, 2)
    px(x + 1, y - 2, '#3a2416', 1, 2)
    px(x - 4, y - 3, '#a67c45', 1, 3)
  }
  { // Għar Dalam: cave in a rocky valley, with stalactites
    const [x, y] = at(toXY([35.834, 14.527]))
    const rock = '#c9a46a'
    px(x - 5, y - 4, rock, 10, 4)
    px(x - 4, y - 5, rock, 8, 1)
    px(x - 3, y - 3, '#3a2416', 6, 3)
    px(x - 2, y - 3, rock)
    px(x + 1, y - 3, rock)
    px(x - 3, y - 1, '#5a3a22', 6, 1)
  }
  { // Filfla: the little uninhabited islet off the south coast
    const [x, y] = at(toXY([35.789, 14.41]))
    px(x - 3, y - 3, '#c49a5e', 6, 3)
    px(x - 2, y - 4, '#d9b67a', 4, 1)
    px(x - 4, y, '#e8fbff', 8, 1)
  }

  // Palm trees along the beaches and promenades
  const palm = ([x, y]) => {
    px(x, y - 2, '#8a5a2b', 1, 2)
    px(x + 1, y - 5, '#8a5a2b', 1, 3)
    px(x - 2, y - 6, '#2f9e57', 3, 1)
    px(x + 2, y - 6, '#2f9e57', 3, 1)
    px(x - 1, y - 7, '#59c97a', 5, 1)
    px(x - 3, y - 5, '#2f9e57')
    px(x + 5, y - 5, '#2f9e57')
    px(x + 1, y - 8, '#59c97a')
  }
  ;[
    [35.938, 14.347], [35.931, 14.349], [36.066, 14.276], [36.065, 14.292], [35.967, 14.366],
    [35.914, 14.506], [35.909, 14.497], [35.847, 14.537], [35.947, 14.44], [35.823, 14.53],
    [36.005, 14.336], [36.03, 14.302],
  ].forEach((ll) => palm(at(toXY(ll))))

  // Beach umbrellas at Golden Bay, Ramla and Mellieħa Bay
  const umbrella = ([x, y], c) => {
    px(x, y - 3, '#ffffff', 1, 3)
    px(x - 2, y - 4, c, 5, 1)
    px(x - 1, y - 5, c, 3, 1)
  }
  umbrella(at(toXY([35.936, 14.345])), '#ff2d95')
  umbrella(at(toXY([36.064, 14.281])), '#2a5cc7')
  umbrella(at(toXY([36.063, 14.288])), '#ffd23f')
  umbrella(at(toXY([35.968, 14.362])), '#ff2d95')

  // Give every building a 1px dark outline, then put the layer on the map
  const data = lctx.getImageData(0, 0, W, H).data
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > 0
  ctx.fillStyle = '#6b3a2a'
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) ctx.fillRect(x, y, 1, 1)
  ctx.drawImage(layer, 0, 0)

  // Boat routes over open water (drawn as marching dashes each frame)
  const route = (lls) => {
    const pts = []
    const ps = lls.map(toXY)
    for (let i = 0; i + 1 < ps.length; i++)
      line((x, y) => !land(x, y) && !land(x, y - 3) && pts.push([x, y]), ps[i], ps[i + 1], null, () => true)
    return pts
  }
  const routes = [
    route([[35.918, 14.52], [35.945, 14.475], [35.975, 14.43], [35.996, 14.39], [36.004, 14.355]]), // Sliema → Comino
    route([[35.992, 14.322], [36.005, 14.31], [36.02, 14.302]]), // Ċirkewwa → Mġarr ferry
  ]

  const region = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? mask[y * W + x] : 0)
  return { canvas, coast, land, routes, region }
}

function makePx(ctx) {
  return (x, y, c, w = 1, h = 1) => {
    ctx.fillStyle = c
    ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }
}

function line(px, [x0, y0], [x1, y1], c, ok) {
  x0 = Math.round(x0)
  y0 = Math.round(y0)
  x1 = Math.round(x1)
  y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    if (ok(x0, y0)) px(x0, y0, c)
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}

const CLOUD = ['....####......', '..########....', '.############.', '##############', '.############.', '...########...']
// Clouds, sparkles and gulls are placed as fractions of the screen so they cover any size.
const CLOUDS = [[0.06, 0.12, 0.25], [0.45, 0.04, 0.18], [0.8, 0.2, 0.22], [0.3, 0.9, 0.2], [0.7, 0.78, 0.16]]
const SPARKLES = [[0.08, 0.5], [0.2, 0.82], [0.93, 0.45], [0.66, 0.1], [0.38, 0.95], [0.92, 0.92], [0.04, 0.2]]
const GULLS = [[0, 0.3, 0.6], [0.5, 0.55, 0.45], [0.8, 0.25, 0.5]]
const HEART = ['01010', '11111', '11111', '01110', '00100']

// The map's own box (in map pixels) that must always be on screen; extra room on top sits under the header.
const BOX = { x: 33, y: -25, w: 250, h: 257 }

// Pick a canvas size that matches the screen's shape and centre the map in it.
function layoutFor(w, h) {
  const a = w / h
  let cw, ch
  if (a >= BOX.w / BOX.h) {
    ch = BOX.h
    cw = Math.round(BOX.h * a)
  } else {
    cw = BOX.w
    ch = Math.round(BOX.w / a)
  }
  const r8 = (v) => Math.round(v / 8) * 8 // keeps the dotted sea grid lined up
  return { W: cw, H: ch, ox: r8((cw - BOX.w) / 2 - BOX.x), oy: r8((ch - BOX.h) / 2 - BOX.y) }
}

// Sea and grid for the whole screen, with the map painted on top.
function makeBackground(base, { W: cw, H: ch, ox, oy }) {
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  const px = makePx(ctx)
  px(0, 0, SEA, cw, ch)
  for (let y = 4; y < ch; y += 8) for (let x = 4; x < cw; x += 8) px(x, y, SEA_DOT)
  ctx.drawImage(base.canvas, ox, oy)

  // Compass rose in the bottom-left corner of the sea
  const cx = 14
  const cy = ch - 16
  for (let a = 0; a < 8; a++)
    px(Math.round(cx + Math.cos((a * Math.PI) / 4) * 5), Math.round(cy + Math.sin((a * Math.PI) / 4) * 5), '#9fe6fa')
  px(cx - 6, cy, '#ffffff', 13, 1)
  px(cx - 3, cy - 1, '#ffffff', 7, 3)
  px(cx, cy - 6, '#d4af37', 1, 13)
  px(cx - 1, cy - 3, '#d4af37', 3, 7)
  px(cx, cy - 6, '#fff2a8', 1, 3)
  px(cx, cy, '#c40e6e')
  ;['1001', '1101', '1011', '1001'].forEach((row, y) =>
    [...row].forEach((v, x) => v === '1' && px(cx - 1 + x, cy - 12 + y, '#ffffff')),
  )
  return canvas
}

// Flights share one runway, staggered so they don't use it at the same time.
// dir 1 = heading east along the runway, -1 = heading west.
const FLIGHT_CYCLE = 200
const FLIGHTS = [
  { type: 'takeoff', dir: 1, offset: 0, tail: '#e23b3b' },
  { type: 'landing', dir: 1, offset: 130, tail: '#2a5cc7' },
  { type: 'takeoff', dir: -1, offset: 90, tail: '#ff2d95' },
  { type: 'landing', dir: -1, offset: 20, tail: '#1f8a4c' },
]

// Where a flight is at time t: ground position (x, y) and its height above it.
function flightAt({ type, dir }, t, ax, ay) {
  const start = ax - dir * 8 // runway end where the roll begins
  const end = ax + dir * 8
  if (type === 'takeoff') {
    if (t < 20) return { x: start + dir * 16 * (t / 20) ** 2, y: ay, alt: 0 } // speeding up down the runway
    if (t < 110) {
      const k = t - 20
      return { x: end + dir * k * 1.6, y: ay - k * 0.45, alt: Math.min(k * 0.35, 24) } // climbing out
    }
    return null
  }
  if (t < 70) {
    const k = 70 - t
    return { x: start - dir * k * 1.6, y: ay + k * 0.35, alt: k * 0.32 } // descending on approach
  }
  if (t < 90) {
    const k = (t - 70) / 20
    return { x: start + dir * 16 * (1 - (1 - k) ** 2), y: ay, alt: 0 } // touchdown and slowing down
  }
  if (t < 110) return { x: end, y: ay, alt: 0 } // taxiing off
  return null
}

// Top-down pixel plane: fuselage, swept wings and a coloured tail.
function drawPlane(px, x, y, dir, tail, body = '#ffffff') {
  x = Math.round(x)
  y = Math.round(y)
  const p = (dx, dy, c) => px(x + dx * dir, y + dy, c)
  for (let i = -3; i <= 3; i++) p(i, 0, body)
  p(4, 0, body === '#ffffff' ? '#cfd6df' : body)
  ;[-3, -2, -1, 1, 2, 3].forEach((dy) => p(0, dy, body))
  p(1, -1, body)
  p(1, 1, body)
  p(-3, -1, tail)
  p(-3, 1, tail)
  p(-3, 0, tail)
}

function drawFrame(ctx, base, L, f) {
  const { W: cw, H: ch, ox, oy } = L
  const px = makePx(ctx)
  const landAt = (x, y) => base.land(x - ox, y - oy) || base.land(x - ox, y - oy - 4)
  ctx.drawImage(L.bg, 0, 0)

  // Twinkling sea sparkles and moving wave dashes
  SPARKLES.forEach(([fx, fy], i) => {
    const x = Math.round(fx * cw)
    const y = Math.round(fy * ch)
    if (landAt(x, y)) return
    const t = (f + i * 3) % 8
    if (t < 5) px(x, y, '#ffffff')
    if (t < 2) {
      px(x - 1, y, '#ffffff')
      px(x + 1, y, '#ffffff')
      px(x, y - 1, '#ffffff')
      px(x, y + 1, '#ffffff')
    }
  })
  const waves = Math.round((cw * ch) / 3500)
  for (let i = 0; i < waves; i++) {
    const y = 6 + ((i * 53) % (ch - 12))
    const x = (((i * 97 + f * (0.4 + (i % 3) * 0.2)) % (cw + 20)) | 0) - 10
    if (!landAt(x, y) && !landAt(x + 3, y)) px(x, y, '#9fe6fa', 4, 1)
  }

  // Everything anchored to the islands is drawn in map coordinates
  ctx.save()
  ctx.translate(ox, oy)

  // Foam flickering along the coastline
  base.coast.forEach(([x, y], i) => {
    if ((i * 7 + f) % 6 === 0) px(x, y, '#e8fbff')
  })

  // Luzzu boats bobbing in Marsaxlokk harbour
  ;[[8, -2, '#2a5cc7'], [12, 4, '#e23b3b']].forEach(([dx, dy, c], i) => {
    const x = Math.round(P.marsaxlokk[0] + dx)
    const y = Math.round(P.marsaxlokk[1] + dy + ((f + i * 2) % 6 < 3 ? 0 : 1))
    px(x, y, '#f6c744', 6, 1)
    px(x + 1, y + 1, c, 4, 1)
    px(x + 5, y - 2, '#f6c744', 1, 2)
    px(x + 4, y, '#ffffff')
  })

  // Dashed boat routes, with a speedboat zipping along the Comino one
  base.routes.forEach((pts) => pts.forEach(([x, y], i) => (i + f) % 6 < 3 && i % 2 === 0 && px(x, y, '#e8fbff')))
  {
    const pts = base.routes[0]
    const n = pts.length
    const i = (f * 2) % (n * 2)
    const k = i < n ? i : 2 * n - 1 - i // there and back
    for (let w = 1; w <= 4; w++) {
      const p = pts[Math.max(0, Math.min(n - 1, k + (i < n ? -w * 2 : w * 2)))]
      if ((f + w) % 2) px(p[0], p[1], '#ffffff')
    }
    const [x, y] = pts[k]
    px(x - 1, y - 1, '#ffffff', 4, 1)
    px(x - 1, y, '#e23b3b', 4, 1)
    px(x, y - 2, '#5b8fd6', 2, 1)
  }

  // Sailboats tacking gently
  ;[[35.928, 14.305, 0], [35.926, 14.53, 7], [35.8, 14.47, 13], [36.088, 14.3, 4]].forEach(([lat, lon, o]) => {
    const [bx, by] = toXY([lat, lon])
    const x = Math.round(bx + Math.sin((f + o * 9) / 25) * 6)
    const y = Math.round(by + ((f + o) % 8 < 4 ? 0 : 1))
    px(x - 3, y, '#ffffff', 7, 1)
    px(x - 2, y + 1, '#2a5cc7', 5, 1)
    px(x, y - 6, '#7a5530', 1, 6)
    ;[1, 2, 3, 4].forEach((w, r) => px(x + 1, y - 5 + r, '#ffffff', w, 1))
    px(x - 2, y - 3, '#ff7ab8', 2, 2)
    px(x - 3, y + 2, '#9fe6fa', 7, 1)
  })

  // Cruise ship waiting outside the Grand Harbour
  {
    const [sx, sy] = toXY([35.912, 14.553])
    const x = Math.round(sx)
    const y = Math.round(sy) + ((f >> 2) % 2)
    px(x - 8, y + 3, SEA_SHADOW, 16, 1)
    px(x - 8, y, '#ffffff', 16, 3)
    px(x - 8, y + 2, '#2a5cc7', 16, 1)
    px(x - 6, y - 2, '#ffffff', 11, 2)
    px(x - 4, y - 4, '#ffffff', 6, 2)
    for (let i = 0; i < 7; i++) px(x - 6 + i * 2, y + 1, '#5b8fd6')
    for (let i = 0; i < 5; i++) px(x - 5 + i * 2, y - 1, '#5b8fd6')
    px(x + 3, y - 6, '#e23b3b', 2, 2)
    px(x + 3, y - 7, '#333333', 2, 1)
  }

  // More luzzus: off Mġarr (Gozo), in the Blue Lagoon and at St Julian's
  ;[[36.018, 14.31, '#e23b3b'], [36.006, 14.318, '#1f8a4c'], [35.926, 14.5, '#2a5cc7']].forEach(([lat, lon, c], i) => {
    const [bx, by] = toXY([lat, lon])
    const x = Math.round(bx)
    const y = Math.round(by + ((f + i * 3) % 6 < 3 ? 0 : 1))
    px(x, y, '#f6c744', 6, 1)
    px(x + 1, y + 1, c, 4, 1)
    px(x + 5, y - 2, '#f6c744', 1, 2)
    px(x + 4, y, '#ffffff')
  })

  // Snorkeller floating in the Blue Lagoon
  {
    const [lx, ly] = P.lagoon
    const x = Math.round(lx) - 1
    const y = Math.round(ly) + 1
    px(x - 2, y + 1, (f >> 1) % 2 ? '#e8fbff' : '#9fe6fa', 6, 1)
    px(x, y, '#f1b997', 2, 1)
    px(x - 1, y, '#3b2a21')
    px(x + 2, y - 2, '#ffd23f', 1, 2)
  }

  // Fish leaping out of the sea
  ;[[36.0, 14.25, 0], [35.88, 14.33, 9], [35.83, 14.6, 17], [35.99, 14.47, 5]].forEach(([lat, lon, o]) => {
    const [fx, fy] = toXY([lat, lon])
    const k = (f + o) % 24
    if (k > 6) return
    const x = Math.round(fx + k)
    const y = Math.round(fy - [0, 2, 3, 4, 3, 2, 0][k])
    if (k === 0 || k === 6) px(x - 1, Math.round(fy), '#ffffff', 3, 1)
    else {
      px(x, y, '#ff9f43', 2, 1)
      px(x - 1, y - 1, '#ff9f43')
      px(x - 1, y + 1, '#ff9f43')
    }
  })

  // Gozo ferry sailing back and forth
  {
    const t = (Math.sin(f / 40) + 1) / 2
    const x = Math.round(P.ferryA[0] + (P.ferryB[0] - P.ferryA[0]) * t) - 4
    const y = Math.round(P.ferryA[1] + (P.ferryB[1] - P.ferryA[1]) * t) - 2
    px(x, y + 3, SEA_SHADOW, 9, 1)
    px(x, y + 1, '#ffffff', 9, 2)
    px(x + 1, y + 2, '#2a5cc7', 7, 1)
    px(x + 2, y, '#ffffff', 5, 1)
    px(x + 5, y - 1, '#e23b3b', 1, 1)
  }

  // Cotton waving from St Paul's Bay
  drawAvatar(px, AV_X, AV_Y, f)

  // Planes taking off and landing at the airport, each with a shadow on the ground
  {
    const [ax, ay] = P.airport
    // A plane parked on the apron
    drawPlane(px, ax - 3, ay + 4, -1, '#ffd23f')
    FLIGHTS.forEach((fl) => {
      const p = flightAt(fl, (f + fl.offset) % FLIGHT_CYCLE, ax, ay)
      if (!p) return
      if (p.alt > 0) {
        ctx.globalAlpha = 0.25
        drawPlane(px, p.x, p.y, fl.dir, '#0b3a52', '#0b3a52')
        ctx.globalAlpha = 1
      }
      drawPlane(px, p.x, p.y - p.alt, fl.dir, fl.tail)
    })
  }
  ctx.restore()

  // Seagulls
  GULLS.forEach(([fx, fy, sp], i) => {
    const x = ((fx * cw + f * sp) % (cw + 40)) - 20
    const y = Math.round(fy * ch)
    const shape = (f + i) % 4 < 2 ? [[0, 0], [1, -1], [2, 0], [3, -1], [4, 0]] : [[0, -1], [1, 0], [2, 0], [3, 0], [4, -1]]
    shape.forEach(([dx, dy]) => px(x + dx, y + dy, '#ffffff'))
  })

  // Drifting clouds with soft shadows
  CLOUDS.forEach(([fx, fy, sp]) => {
    const y = Math.round(fy * ch)
    const x = Math.round(((fx * cw + f * sp) % (cw + 30)) - 20)
    ctx.globalAlpha = 0.12
    CLOUD.forEach((row, dy) => [...row].forEach((v, dx) => v === '#' && px(x + dx + 5, y + dy + 10, '#0b3a52')))
    ctx.globalAlpha = 1
    CLOUD.forEach((row, dy) =>
      [...row].forEach((v, dx) => v === '#' && px(x + dx, y + dy, dy >= 4 ? '#dfe9f5' : '#ffffff')),
    )
  })
}

function drawAvatar(px, ox, oy, f) {
  const p = (x, y, c, w, h) => px(ox + x, oy + y, c, w, h)
  const S = '#f1b997', s = '#d8977a', Hr = '#3b2a21', B = '#6e5246', M = '#2e1c14', E = '#2a1d1a'
  const T = '#f4efe8', t = '#d8d0c4', K = '#ff2d95', ink = '#3d4a5a'
  const wave = f % 4 < 2

  // Splash rings in the bay around his feet
  const ring = f % 6 < 3 ? '#e8fbff' : '#9fe6fa'
  p(-3, 35, ring, 18, 1)
  p(-1, 36, ring, 14, 1)

  // Head: short dark hair, faded sides
  p(2, 0, Hr, 7, 1)
  p(1, 1, Hr, 9, 2)
  p(3, 0, '#5a4030', 3, 1)
  p(1, 3, '#5a4636', 1, 1)
  p(9, 3, '#5a4636', 1, 1)
  p(2, 3, S, 7, 7)
  p(1, 5, S, 1, 2)
  p(9, 5, S, 1, 2)
  p(3, 10, S, 5, 1)
  p(3, 4, Hr, 2, 1)
  p(6, 4, Hr, 2, 1)
  p(4, 5, E)
  p(6, 5, E)
  p(5, 6, s)
  // Stubble and mouth
  for (let x = 2; x <= 8; x++) if (x % 2 === 0) p(x, 9, B)
  p(3, 10, B, 5, 1)
  p(2, 10, '#8a6a5a')
  p(8, 10, '#8a6a5a')
  p(4, 9, '#9c5048', 3, 1)
  // Twirly handlebar moustache
  p(4, 7, M, 3, 1)
  p(2, 8, M, 7, 1)
  ;[[1, 8], [0, 7], [-1, 6], [-1, 5], [0, 4], [9, 8], [10, 7], [11, 6], [11, 5], [10, 4]].forEach(([x, y]) => p(x, y, M))
  p(4, 11, s, 3, 2)

  // White vest with the wizard possum
  p(0, 12, S, 2, 3)
  p(10, 12, S, 2, 3)
  p(2, 12, T, 2, 2)
  p(7, 12, T, 3, 2)
  p(2, 13, T, 8, 1)
  p(1, 14, T, 10, 10)
  p(1, 14, t, 1, 10)
  p(10, 14, t, 1, 10)
  p(6, 14, '#9b6fb0')
  p(5, 15, '#9b6fb0', 2, 1)
  p(4, 16, '#9b6fb0', 4, 1)
  p(3, 17, '#6e4a85', 5, 1)
  p(4, 18, '#ffffff', 4, 2)
  p(4, 18, '#111111')
  p(6, 18, '#111111')
  p(5, 19, '#f29bb0')
  p(3, 20, '#7d8f5a', 6, 1)
  p(3, 21, '#e0d6c0', 6, 1)
  p(3, 22, '#cfc3a8', 6, 1)

  // Arms with tattoos; right one waving
  p(-1, 13, S, 2, 9)
  p(-1, 13, s, 1, 9)
  p(-1, 22, S, 2, 2)
  ;[[0, 15], [-1, 16], [0, 17], [-1, 19]].forEach(([x, y]) => p(x, y, ink))
  p(12, 8, S, 2, 6)
  p(wave ? 12 : 13, 5, S, 3, 3)
  if (!wave) p(14, 8, S)
  p(12, 10, ink)
  p(13, 11, ink)

  // Pink board shorts, legs, flip-flops
  p(1, 24, K, 10, 3)
  p(1, 27, K, 4, 2)
  p(7, 27, K, 4, 2)
  p(1, 24, '#c40e6e', 10, 1)
  p(1, 25, '#ffffff', 1, 4)
  p(10, 25, '#ffffff', 1, 4)
  p(2, 29, S, 3, 5)
  p(7, 29, S, 3, 5)
  p(2, 29, s, 1, 5)
  p(1, 34, '#ffd23f', 4, 1)
  p(7, 34, '#ffd23f', 4, 1)

  // Hearts float up from the waving hand
  const k = f % 10
  if (k < 5) HEART.forEach((row, y) => [...row].forEach((v, x) => v === '1' && p(15 + x, 2 - k - (4 - y), '#ff2d95')))
}

export default function PixelMap() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const baseRef = useRef(null)
  const [layout, setLayout] = useState(null)

  // Draw the islands once, then follow the screen size.
  useEffect(() => {
    baseRef.current = buildStatic()
    const el = wrapRef.current
    const update = () => {
      const next = layoutFor(el.clientWidth || 1, el.clientHeight || 1)
      setLayout((prev) =>
        prev && prev.W === next.W && prev.H === next.H && prev.ox === next.ox && prev.oy === next.oy ? prev : next,
      )
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Animate
  useEffect(() => {
    if (!layout) return
    const canvas = canvasRef.current
    canvas.width = layout.W
    canvas.height = layout.H
    const ctx = canvas.getContext('2d')
    const L = { ...layout, bg: makeBackground(baseRef.current, layout) }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawFrame(ctx, baseRef.current, L, 0)
      return
    }
    let raf = 0
    let last = -1
    const tick = (t) => {
      const f = Math.floor(t / FRAME_MS)
      if (f !== last) {
        last = f
        drawFrame(ctx, baseRef.current, L, f)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [layout])

  const pct = ([x, y]) => ({
    left: ((x + layout.ox) / layout.W) * 100 + '%',
    top: ((y + layout.oy) / layout.H) * 100 + '%',
  })

  // Which island's labels are showing: follows the mouse, or the last tap on touch screens.
  const [active, setActive] = useState(0)
  const islandAt = (e) => {
    if (!layout || !baseRef.current) return 0
    const r = wrapRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * layout.W - layout.ox
    const y = ((e.clientY - r.top) / r.height) * layout.H - layout.oy
    return islandNear(baseRef.current, x, y)
  }
  const onPointerMove = (e) => e.pointerType === 'mouse' && setActive(islandAt(e))
  const onPointerLeave = (e) => e.pointerType === 'mouse' && setActive(0)
  const onPointerDown = (e) => e.pointerType !== 'mouse' && setActive(islandAt(e))

  // Grouped labels are hidden until their island is active; ungrouped ones (St Paul's Bay) always show.
  const vis = (group) => (group ? ' grouped' + (group === active ? ' show' : '') : '')

  return (
    <div
      className={'map-hero' + (active ? ' hovering' : '')}
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
    >
      <canvas
        ref={canvasRef}
        className="pixel-scene"
        role="img"
        aria-label="Pixel-art map of Malta, Gozo and Comino. Cotton is waving from St Paul's Bay on Malta's north coast."
      />
      {layout &&
        NAMES.map((n) => (
          <span
            key={n.text}
            className={'map-name' + (n.big ? ' big' : '') + (n.small ? ' small' : '') + vis(n.group)}
            style={pct(n.at)}
            aria-hidden="true"
          >
            {n.text}
          </span>
        ))}
      {layout &&
        LABELS.map((l) => (
          <span
            key={l.text}
            className={
              'map-label' +
              (l.side === 'left' ? ' left' : '') +
              (l.you ? ' you' : '') +
              (l.minor ? ' minor' : '') +
              vis(l.group)
            }
            style={pct(l.at)}
            aria-hidden="true"
          >
            {l.text}
            {l.sub && <span className="sub">{l.sub}</span>}
          </span>
        ))}
      <p className="map-hint" aria-hidden="true">
        <span className="hint-mouse">✦ Hover over an island to explore ✦</span>
        <span className="hint-touch">✦ Tap an island to explore ✦</span>
      </p>
    </div>
  )
}
