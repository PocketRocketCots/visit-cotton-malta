import { useEffect, useRef } from 'react'

// Pixel-art view from inside Cotton's apartment: white walls, louvred shutters folded back,
// glossy grey tiles, and a huge balcony with a glass balustrade looking out over St Paul's Bay.
// The canvas is SH pixels tall; its width follows the shape of the screen.

const SH = 150
const HZ = 58 // horizon
const RAIL = 74 // top of the glass balustrade
const BAL = 84 // where the balcony floor starts (far edge)
const SILL = 106 // door track: inside floor starts here
const FRAME_MS = 160

const makePx = (ctx) => (x, y, c, w = 1, h = 1) => {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function line(px, x0, y0, x1, y1, c) {
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
    px(x0, y0, c)
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

const CLOUD = ['...####.......', '.########..##.', '##############', '.############.']

// A cocktail glass with an orange drink, a slice and a little paper umbrella
function cocktail(px, gx, gy) {
  px(gx + 2, gy - 3, '#ff5f8f', 4, 1)
  px(gx + 3, gy - 4, '#ff5f8f', 2, 1)
  px(gx + 3, gy - 2, '#8a5a2b', 1, 2)
  px(gx, gy, '#cfe9f5', 5, 1)
  px(gx, gy + 1, '#ff9f43', 5, 1)
  px(gx + 1, gy + 2, '#ff9f43', 3, 1)
  px(gx + 2, gy + 3, '#ffc98a')
  px(gx + 2, gy + 4, '#e4f0f6', 1, 2)
  px(gx + 1, gy + 6, '#e4f0f6', 3, 1)
  px(gx + 4, gy, '#ffd23f')
}

// Cotton reclining on a sun-lounger (same look as on the map: dark hair, stubble, twirly moustache,
// wizard-possum vest, tattoos), legs stretched out, cocktail in hand. Every so often he takes a sip.
function drawLounging(px, ox, oy, f) {
  const p = (x, y, c, w = 1, h = 1) => px(ox + x, oy + y, c, w, h)
  const S = '#f1b997', s = '#d8977a', Hr = '#3b2a21', B = '#6e5246', M = '#2e1c14', E = '#2a1d1a'
  const T = '#f4efe8', t = '#d8d0c4', K = '#2a83c3', ink = '#3d4a5a'
  const sip = f % 40 < 7

  // Legs stretched out along the lounger, in blue board shorts, flip-flops on
  p(-3, 21, K, 6, 3)
  p(-3, 21, '#1d5fa8', 6, 1)
  p(-10, 22, S, 7, 2)
  p(-10, 22, s, 7, 1)
  p(-11, 21, '#ffd23f', 1, 3)

  // Head: short dark hair, faded sides, stubble and the twirly handlebar moustache
  p(2, 0, Hr, 7, 1)
  p(1, 1, Hr, 9, 2)
  p(3, 0, '#5a4030', 3, 1)
  p(2, 3, S, 7, 7)
  p(1, 5, S, 1, 2)
  p(9, 5, S, 1, 2)
  p(3, 10, S, 5, 1)
  p(3, 4, Hr, 2, 1)
  p(6, 4, Hr, 2, 1)
  if (sip) {
    p(3, 5, E, 2, 1) // eyes shut, enjoying it
    p(6, 5, E, 2, 1)
  } else {
    p(4, 5, E)
    p(6, 5, E)
  }
  p(5, 6, s)
  for (let x = 2; x <= 8; x++) if (x % 2 === 0) p(x, 9, B)
  p(3, 10, B, 5, 1)
  p(4, 9, '#9c5048', 3, 1)
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
  p(1, 14, T, 10, 8)
  p(1, 14, t, 1, 8)
  p(10, 14, t, 1, 8)
  p(6, 14, '#9b6fb0')
  p(5, 15, '#9b6fb0', 2, 1)
  p(4, 16, '#9b6fb0', 4, 1)
  p(3, 17, '#6e4a85', 5, 1)
  p(4, 18, '#ffffff', 4, 2)
  p(4, 18, '#111111')
  p(6, 18, '#111111')
  p(5, 19, '#f29bb0')

  // Left arm resting on the lounger, with tattoo
  p(-1, 13, S, 2, 8)
  p(-1, 13, s, 1, 8)
  ;[[0, 15], [-1, 16], [0, 17]].forEach(([x, y]) => p(x, y, ink))

  // Right arm holding the cocktail up — raised to his mouth for a sip now and then
  if (sip) {
    p(10, 9, S, 2, 5)
    p(8, 8, S, 3, 2)
    cocktail(px, ox + 7, oy + 4)
  } else {
    p(11, 12, S, 2, 5)
    p(12, 10, S, 2, 3)
    p(12, 13, ink)
    cocktail(px, ox + 12, oy + 4)
  }
}

function draw(ctx, W, f) {
  const px = makePx(ctx)
  const o0 = Math.round(W * 0.13) // balcony opening, left edge
  const o1 = Math.round(W * 0.87) // and right edge
  const vx = W * 0.5 // vanishing point for the floor tiles
  const bands = (list, x, w, bottom) => {
    list.forEach(([y, c], i) => px(x, y, c, w, (i + 1 < list.length ? list[i + 1][0] : bottom) - y))
    for (let i = 1; i < list.length; i++) {
      const [y, c] = list[i]
      for (let xx = x + (y % 2); xx < x + w; xx += 2) px(xx, y, list[i - 1][1])
      for (let xx = x + ((y + 1) % 2); xx < x + w; xx += 2) px(xx, y - 1, c)
    }
  }

  // ---- Outside, seen through the opening ----
  ctx.save()
  ctx.beginPath()
  ctx.rect(o0, 14, o1 - o0, SILL - 14)
  ctx.clip()

  bands([[14, '#3f8fd6'], [24, '#5aa3e0'], [34, '#78b6e8'], [44, '#98c9ef'], [52, '#b8dbf3']], o0, o1 - o0, HZ)
  // Drifting clouds
  ;[[0.1, 22, 0.15], [0.5, 30, 0.1], [0.78, 19, 0.12]].forEach(([fx, y, sp]) => {
    const span = o1 - o0 + 30
    const x = Math.round(o0 - 15 + ((fx * span + f * sp) % span))
    CLOUD.forEach((row, dy) => [...row].forEach((v, dx) => v === '#' && px(x + dx, y + dy, dy === 3 ? '#e4eef7' : '#ffffff')))
  })
  // The headland across the bay, with little white buildings, and a faint island further out
  const h0 = o0 + Math.round(W * 0.03)
  const hw = Math.round(W * 0.42)
  px(h0, HZ - 2, '#c9b48a', hw, 2)
  px(h0 + Math.round(hw * 0.1), HZ - 3, '#b9a47a', Math.round(hw * 0.5), 1)
  px(h0 + Math.round(hw * 0.25), HZ - 4, '#a8956a', Math.round(hw * 0.2), 1)
  for (let i = 0; i < hw; i += 5) if ((i * 7) % 3 === 0) px(h0 + i, HZ - 3, '#f3efe6', 2, 1)
  px(o1 - Math.round(W * 0.2), HZ - 1, '#9bb7c9', Math.round(W * 0.12), 1)
  // Deep blue sea with moving sparkles and a couple of boats
  bands([[HZ, '#1d5fa8'], [62, '#2370b6'], [67, '#2a83c3'], [72, '#3196cf']], o0, o1 - o0, BAL)
  for (let i = 0; i < W / 6; i++) {
    const y = HZ + 2 + ((i * 7) % 20)
    const x = o0 + Math.round(((i * 41 + f * (0.5 + (i % 3) * 0.3)) % (o1 - o0 + 10)) - 5)
    px(x, y, (i + f) % 5 === 0 ? '#ffffff' : '#8fd0f0', 2 + (i % 2), 1)
  }
  ;[[0.3, 64, 0.2], [0.65, 61, 0.12]].forEach(([fx, y, sp], i) => {
    const span = o1 - o0
    const x = Math.round(o0 + ((fx * span + f * sp) % span))
    px(x, y, '#ffffff', 5, 1)
    px(x + 1, y - 1, i ? '#e23b3b' : '#ffffff', 3, 1)
    px(x - 1, y + 1, '#8fd0f0', 7, 1)
  })
  // The lido below: white rooftops, a turquoise pool, parasols, and swaying palms
  const lx = Math.round(W * 0.52)
  px(lx, 76, '#f1eee8', Math.round(W * 0.3), 8)
  px(lx + 6, 77, '#5fd8e0', Math.round(W * 0.12), 4)
  px(lx + 7, 77, '#8ce8ee', Math.round(W * 0.05), 1)
  ;['#2a5cc7', '#ffffff', '#2a5cc7', '#ffffff'].forEach((c, i) => {
    const ux = lx + Math.round(W * 0.15) + i * 6
    px(ux, 78, c, 4, 1)
    px(ux + 1, 77, c, 2, 1)
    px(ux + 2, 79, '#9aa3aa', 1, 3)
  })
  const sway = f % 12 < 6 ? 0 : 1
  ;[[0.62, 70], [0.72, 67], [0.33, 72]].forEach(([fx, y]) => {
    const x = Math.round(W * fx)
    px(x, y + 1, '#8a6a42', 1, 14)
    px(x - 5 + sway, y - 1, '#2f8f4e', 5, 1)
    px(x + 1 + sway, y - 1, '#2f8f4e', 5, 1)
    px(x - 3 + sway, y - 2, '#4fb36a', 7, 1)
    px(x - 6 + sway, y, '#2f8f4e', 2, 1)
    px(x + 5 + sway, y, '#2f8f4e', 2, 1)
    px(x - 1 + sway, y - 3, '#4fb36a', 3, 1)
  })

  // Glass balustrade along the far edge of the balcony
  px(o0, RAIL, '#8f99a1', o1 - o0, 1)
  ctx.fillStyle = 'rgba(200,232,245,.28)'
  ctx.fillRect(o0, RAIL + 1, o1 - o0, BAL - RAIL - 1)
  for (let x = o0 + 4; x < o1; x += Math.max(14, Math.round(W / 14))) {
    px(x, RAIL + 1, '#c3cacf', 1, BAL - RAIL - 1)
    px(x + 3, RAIL + 2, 'rgba(255,255,255,.55)', 1, 3)
    px(x + 4, RAIL + 5, 'rgba(255,255,255,.4)', 1, 2)
  }

  // The (massive) balcony floor: big grey tiles in perspective
  px(o0, BAL, '#b9bec2', o1 - o0, SILL - BAL)
  ;[88, 93, 99].forEach((y) => px(o0, y, '#a9aeb2', o1 - o0, 1))
  for (let k = -12; k <= 12; k++) line(px, vx + k * W * 0.055, BAL, vx + k * W * 0.085, SILL, '#a9aeb2')
  // Sun-loungers on the left, a bistro table and big potted plant on the right
  ;[0.2, 0.31].forEach((fx) => {
    const x = Math.round(W * fx)
    px(x, 95, '#f4f4f2', 16, 3)
    px(x + 12, 91, '#f4f4f2', 4, 4)
    px(x + 13, 90, '#f4f4f2', 3, 1)
    px(x, 98, '#cfd3d6', 16, 1)
    px(x + 1, 99, '#9aa3aa', 1, 3)
    px(x + 14, 99, '#9aa3aa', 1, 3)
    px(x + 4, 94, '#5fc3e4', 6, 1) // a folded beach towel
  })
  // Cotton, lounging on the second sun-lounger with a cocktail
  drawLounging(px, Math.round(W * 0.31) + 4, 71, f)
  {
    const x = Math.round(W * 0.66)
    px(x, 92, '#ffffff', 10, 1)
    px(x + 4, 93, '#cfd3d6', 2, 7)
    px(x + 2, 100, '#cfd3d6', 6, 1)
    px(x + 3, 90, '#2a2a2a', 2, 2) // a pint, naturally
    px(x + 3, 89, '#f1e2bd', 2, 1)
    ;[-5, 12].forEach((dx) => {
      px(x + dx, 90, '#ffffff', 3, 5)
      px(x + dx, 95, '#ffffff', 4, 1)
      px(x + dx + 1, 96, '#cfd3d6', 1, 5)
    })
    const pxp = Math.round(W * 0.8)
    px(pxp, 94, '#f4f4f2', 7, 8)
    px(pxp, 94, '#dcdcda', 1, 8)
    ;[[-3, 86], [1, 83], [5, 85], [-1, 89], [7, 90], [2, 88]].forEach(([dx, y], i) =>
      px(pxp + dx + sway, y, i % 2 ? '#4fb36a' : '#2f8f4e', 4, 4),
    )
  }
  ctx.restore()

  // ---- Inside ----
  // Ceiling with downlights, and white walls either side of the opening
  px(0, 0, '#f3f2ef', W, 14)
  px(0, 13, '#dcd9d3', W, 1)
  for (let x = Math.round(W / 8); x < W; x += Math.round(W / 4)) {
    px(x - 1, 6, '#fffbe8', 4, 1)
    px(x, 6, '#fff2b8', 2, 1)
  }
  px(0, 14, '#ece9e4', o0, SILL - 14)
  px(o1, 14, '#ece9e4', W - o1, SILL - 14)
  px(0, 14, '#e2dfd9', W, 2) // lintel shadow
  px(o0 - 2, 14, '#d5d2cc', 2, SILL - 14) // door frame
  px(o1, 14, '#d5d2cc', 2, SILL - 14)
  px(0, SILL - 3, '#e0ddd7', o0 - 2, 3) // skirting
  px(o1 + 2, SILL - 3, '#e0ddd7', W - o1 - 2, 3)
  // White louvred shutters folded back against the walls
  const shutter = (x, w) => {
    px(x, 16, '#f8f7f4', w, SILL - 20)
    for (let y = 19; y < SILL - 6; y += 2) px(x + 1, y, '#dedbd5', w - 2, 1)
    px(x, 16, '#d8d5cf', 1, SILL - 20)
    px(x + w - 1, 16, '#d8d5cf', 1, SILL - 20)
    px(x + Math.floor(w / 2), 16, '#e6e3dd', 1, SILL - 20)
  }
  const sw = Math.max(8, Math.round(W * 0.05))
  shutter(o0 - 2 - sw * 2, sw)
  shutter(o0 - 2 - sw, sw)
  shutter(o1 + 2, sw)
  shutter(o1 + 2 + sw, sw)

  // Glossy grey tiled floor, with the bright opening reflected in it
  px(0, SILL, '#8d9399', W, 1) // sliding-door track
  px(0, SILL + 1, '#c4c7ca', W, SH - SILL - 1)
  ctx.fillStyle = 'rgba(205,228,246,.45)'
  ctx.fillRect(o0, SILL + 1, o1 - o0, 18)
  ctx.fillStyle = 'rgba(205,228,246,.22)'
  ctx.fillRect(o0, SILL + 19, o1 - o0, 14)
  for (let x = o0 + 3; x < o1; x += 9) px(x, SILL + 2 + (x % 5), 'rgba(255,255,255,.5)', 1, 6)
  ;[113, 122, 134].forEach((y) => px(0, y, '#b2b6ba', W, 1))
  for (let k = -16; k <= 16; k++) line(px, vx + k * W * 0.07, SILL + 1, vx + k * W * 0.13, SH, '#b2b6ba')

  // A light grey sofa in the bottom-left corner, and a big plant bottom-right
  const sx = Math.round(W * 0.02)
  const sw2 = Math.round(W * 0.26)
  px(sx, SH - 22, '#d6d6d4', sw2, 22)
  px(sx, SH - 22, '#e2e2e0', sw2, 2)
  for (let x = sx + 8; x < sx + sw2 - 4; x += 12) px(x, SH - 17, '#c2c2c0', 2, 2)
  px(sx + sw2 - 6, SH - 26, '#d0d0ce', 6, 26)
  const plx = W - Math.round(W * 0.06)
  px(plx, SH - 14, '#f4f4f2', 10, 14)
  px(plx, SH - 14, '#dcdcda', 2, 14)
  ;[[-4, -26], [2, -32], [8, -27], [-6, -20], [10, -21], [3, -23], [-1, -30]].forEach(([dx, dy], i) =>
    px(plx + dx, SH + dy, i % 2 ? '#3f9b5a' : '#2c7a45', 6, 5),
  )
}

export default function ApartmentScene() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0
    let last = 0
    const size = () => {
      const r = canvas.getBoundingClientRect()
      const next = Math.max(160, Math.round((SH * (r.width || 1)) / (r.height || 1)))
      if (next === W) return
      W = next
      canvas.width = W
      canvas.height = SH
      draw(ctx, W, last)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    let raf = 0
    const tick = (t) => {
      const f = Math.floor(t / FRAME_MS)
      if (f !== last) {
        last = f
        draw(ctx, W, f)
      }
      raf = requestAnimationFrame(tick)
    }
    if (!still) raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="apt-scene"
      role="img"
      aria-label="Pixel-art view from inside a bright white apartment, through folded-back louvred shutters, onto a huge balcony with a glass balustrade overlooking the deep blue bay"
    />
  )
}
