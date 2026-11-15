import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DISTANT_LAND, GLINT, SEA, SKY, SUN, WAVE, rows } from '../lib/palette'

// "Split the G" — full-width pixel-art scene: Cotton sits at a table on a seafront bar terrace.
// Click to start: he picks up the pint and drinks (you can't see the level while it's at his mouth).
// Click again: he puts it down, revealing whether the line between stout and head sits on the middle of the G.

// ---------- The pint (drawn into its own small canvas, then placed in the scene) ----------
const PW = 54
const PH = 77
const PCX = 27
const TOP = 6 // inside top of the glass
const BOTTOM = 72 // inside bottom of the glass
const HEAD = 4 // creamy head thickness
const FULL = TOP + HEAD + 1 // where the stout starts on a fresh pint
const SPEED = 11 // drinking speed at full pace, pixels per second
const MM_PER_PX = 2
const WIN_MARGIN = 1.6 // how far (in pixels) from the target still counts as a perfect split

// Guinness-style tulip pint: narrower rim, a bulge a third of the way down, tapering to the base
const PROFILE = [[6, 16], [18, 18], [34, 16], [54, 13], [72, 11]]
function halfWidth(y) {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [a, ha] = PROFILE[i]
    const [b, hb] = PROFILE[i + 1]
    if (y <= b) return Math.round(ha + ((hb - ha) * (y - a)) / (b - a))
  }
  return 10
}

// "GUINNESS" across the glass in a little pixel font. Row 2 (the middle of the G) is the target.
const FONT = {
  G: ['###', '#..', '#.#', '#.#', '###'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  I: ['#', '#', '#', '#', '#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  E: ['###', '#..', '##.', '#..', '###'],
  S: ['###', '#..', '###', '..#', '###'],
}
const WORD = 'GUINNESS'
const WORD_W = [...WORD].reduce((w, ch) => w + FONT[ch][0].length + 1, -1)
const WORD_TOP = 28
const WORD_LEFT = PCX - Math.floor(WORD_W / 2)
const TARGET = WORD_TOP + 2

const makePx = (ctx) => (x, y, c, w = 1, h = 1) => {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function drawPint(ctx, level, t) {
  const px = makePx(ctx)
  ctx.clearRect(0, 0, PW, PH)
  const line = Math.round(level)
  for (let y = TOP; y < BOTTOM; y++) {
    const h = halfWidth(y)
    const x0 = PCX - h
    const w = 2 * h + 1
    if (y >= line) {
      px(x0 + 1, y, '#1a0d08', w - 2) // stout
      px(x0 + 1, y, '#4a1d10') // ruby glow at the edges
      px(x0 + w - 2, y, '#35140b')
    } else if (y >= line - HEAD) {
      px(x0 + 1, y, y === line - HEAD ? '#fff8e4' : '#f1e2bd', w - 2) // creamy head
    } else {
      px(x0 + 1, y, 'rgba(225,240,248,.55)', w - 2) // empty glass
    }
    px(x0, y, '#a9cfe0')
    px(x0 + w - 1, y, '#a9cfe0')
    if (y > TOP + 3 && y < BOTTOM - 6) px(x0 + 2, y, 'rgba(255,255,255,.45)')
  }
  px(PCX - halfWidth(TOP), TOP - 1, '#e6f4fa', 2 * halfWidth(TOP) + 1)
  px(PCX - 12, BOTTOM, '#cfe3ec', 25, 4)
  // Bubbles cascading in the stout
  const depth = BOTTOM - line - 2
  if (depth > 2)
    for (let i = 0; i < 7; i++) {
      const by = Math.round(BOTTOM - 2 - ((t * 18 + i * 11) % depth))
      if (by > line) px(PCX - 7 + ((i * 5) % 14), by, '#5a3020')
    }
  // GUINNESS printed on the glass: cream letters with a dark shadow so they show on stout and on empty glass
  const letters = (dx0, dy0, c) => {
    let x = WORD_LEFT + dx0
    for (const ch of WORD) {
      FONT[ch].forEach((row, dy) => [...row].forEach((v, dx) => v === '#' && px(x + dx, WORD_TOP + dy + dy0, c)))
      x += FONT[ch][0].length + 1
    }
  }
  letters(1, 1, '#3a2a12')
  letters(0, 0, '#fbf1d6')
  // A small gold flourish above the word, like the label on a real pint glass
  px(PCX - 3, WORD_TOP - 3, '#e3b54a', 7, 1)
  px(PCX - 1, WORD_TOP - 4, '#e3b54a', 3, 1)
  // Little markers either side of the glass at the target height
  const th = halfWidth(TARGET)
  px(PCX - th - 4, TARGET, '#ffd23f', 2, 1)
  px(PCX + th + 3, TARGET, '#ffd23f', 2, 1)
}

// ---------- The scene ----------
const SH = 128 // scene height in pixels (width follows the screen shape)
const HORIZON = 56
const RAIL = 76
const TABLE = 104 // table-top line
const LIFT_MS = 420

function drawScene(ctx, W, s) {
  const px = makePx(ctx)
  const f = Math.floor(s.t * 6)
  const bands = (list, bottom) => {
    list.forEach(([y, c], i) => px(0, y, c, W, (i + 1 < list.length ? list[i + 1][0] : bottom) - y))
    for (let i = 1; i < list.length; i++) {
      const [y, c] = list[i]
      for (let x = y % 2; x < W; x += 2) px(x, y, list[i - 1][1])
      for (let x = (y + 1) % 2; x < W; x += 2) px(x, y - 1, c)
    }
  }
  const disc = (cx, cy, r, c) => {
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy))
      px(cx - w, cy + dy, c, 2 * w + 1, 1)
    }
  }

  // Sunset sky and sun
  bands(rows(SKY, 0, HORIZON), HORIZON)
  const sx = Math.round(W * 0.84)
  disc(sx, HORIZON - 7, 12, SUN[0])
  disc(sx, HORIZON - 7, 10, SUN[1])
  // Distant Gozo on the horizon
  px(Math.round(W * 0.05), HORIZON - 3, DISTANT_LAND, Math.round(W * 0.24), 3)
  px(Math.round(W * 0.09), HORIZON - 5, DISTANT_LAND, Math.round(W * 0.12), 2)
  px(Math.round(W * 0.12), HORIZON - 6, DISTANT_LAND, Math.round(W * 0.05), 1)

  // Sea with moving wave dashes, sun glitter and a passing sailboat
  bands(rows(SEA, HORIZON, RAIL), RAIL)
  for (let i = 0; i < W / 10; i++) {
    const y = HORIZON + 3 + ((i * 7) % 16)
    const x = Math.round(((i * 37 + f * 0.6 * (1 + (i % 3))) % (W + 10)) - 5)
    px(x, y, WAVE, 3, 1)
  }
  for (let y = HORIZON + 1; y < RAIL; y += 2) {
    const spread = 2 + ((y - HORIZON) >> 1)
    for (let k = 0; k < 2; k++) px(sx + ((y * 7 + k * 5 + f * 3) % (2 * spread + 1)) - spread, y, GLINT, 2, 1)
  }
  {
    const bx = Math.round(((s.t * 3) % (W + 24)) - 12)
    px(bx - 3, 66, '#ffffff', 8, 1)
    px(bx - 2, 67, '#2a5cc7', 6, 1)
    px(bx, 60, '#7a5530', 1, 6)
    ;[1, 2, 3, 4].forEach((w, r) => px(bx + 1, 61 + r, '#ffffff', w, 1))
  }

  // Limestone balustrade
  px(0, RAIL, '#fff6e2', W, 2)
  px(0, RAIL + 2, '#d9c7a0', W, 1)
  for (let x = 1; x < W; x += 7) {
    px(x, RAIL + 3, '#f3e2b3', 3, 9)
    px(x - 1, RAIL + 6, '#f3e2b3', 5, 3) // the bulge in each baluster
    px(x + 2, RAIL + 3, '#cdb48a', 1, 9)
  }
  px(0, RAIL + 12, '#f3e2b3', W, 2)
  // Terrace tiles
  px(0, RAIL + 14, '#e9c886', W, TABLE - RAIL - 14)
  px(0, 97, '#d4b06a', W, 1)
  for (let x = 4; x < W; x += 12) px(x, RAIL + 14, '#d4b06a', 1, TABLE - RAIL - 14)

  // Striped bar awning and a limestone pillar on the left
  const aw = Math.round(Math.min(W * 0.18, 56))
  px(0, 10, '#f3e2b3', Math.max(6, Math.round(aw * 0.3)), TABLE - 10)
  px(Math.max(6, Math.round(aw * 0.3)) - 1, 10, '#cdb48a', 1, TABLE - 10)
  for (let x = 0; x < aw; x++) px(x, 0, Math.floor(x / 4) % 2 ? '#1d5fa8' : '#ffffff', 1, 10)
  for (let x = 0; x < aw; x += 4) px(x, 10, Math.floor(x / 4) % 2 ? '#1d5fa8' : '#ffffff', 4, 1)
  for (let x = 1; x < aw; x += 4) px(x, 11, Math.floor(x / 4) % 2 ? '#1d5fa8' : '#ffffff', 2, 1)

  // Bougainvillea in a terracotta pot on the right
  {
    const bx = W - 16
    const blooms = [[-6, -24], [-2, -28], [3, -25], [7, -21], [-8, -18], [0, -20], [5, -16], [-4, -13], [9, -27], [-9, -26]]
    blooms.forEach(([dx, dy], i) => {
      px(bx + dx, RAIL + 12 + dy, '#3f9b5a', 3, 2)
      px(bx + dx + 1, RAIL + 11 + dy, i % 2 ? '#d6247f' : '#ff5fa8', 2, 2)
    })
    px(bx - 6, RAIL + 4, '#c8643a', 12, 10)
    px(bx - 7, RAIL + 3, '#d8774a', 14, 2)
    px(bx - 6, RAIL + 4, '#a84f2c', 2, 10)
  }

  // Festoon lights strung across the top, twinkling
  for (let x = 0; x < W; x++) {
    const y = 3 + Math.round(5 * Math.sin(Math.PI * ((x % 64) / 64)))
    px(x, y, '#5a3a22')
    if (x % 8 === 4) {
      const on = (x / 8 + f) % 9 !== 0
      px(x - 1, y + 1, on ? ['#ffd23f', '#ff9de0', '#9ff0ff', '#fff6c0'][(x / 8) % 4 | 0] : '#8a6a52', 3, 2)
    }
  }

  // Cotton, sat behind the table
  const ax = Math.round(s.focus + 14)
  const ay = TABLE - 46
  drawSeated(px, ax, ay, s.pose, f)

  // Wooden table
  px(0, TABLE, '#d9a46a', W, 1)
  px(0, TABLE + 1, '#c28a52', W, 3)
  px(0, TABLE + 4, '#a8703c', W, SH - TABLE - 4)
  for (let i = 0; i < W / 9; i++) px((i * 23) % W, TABLE + 7 + ((i * 5) % 18), '#93602f', 6 + (i % 4) * 3, 1)

  // The pint: on the table, moving to and from his mouth, or tipped up while he drinks
  const tx = Math.round(s.focus - 54)
  const ty = TABLE + 3 - PH
  const mx = ax + 12
  const my = ay + 19
  const onTable = { x: tx, y: ty, w: PW, h: PH }
  const atMouth = { x: mx - 11, y: my - 18, w: 22, h: 35 }
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k })
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)
  if (s.phase === 'drinking') drawTippedUp(px, mx, my + (f % 4 < 2 ? 0 : 1))
  else {
    let r = onTable
    if (s.phase === 'lifting') r = lerp(onTable, atMouth, ease(s.k))
    if (s.phase === 'lowering') r = lerp(atMouth, onTable, ease(s.k))
    if (r === onTable) px(tx + 10, TABLE + 2, 'rgba(60,30,10,.25)', 30, 2) // shadow on the table
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(s.pint, Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h))
  }
}

// The pint seen from below while tipped up to his mouth: just the glass base and the dark stout, no level visible
function drawTippedUp(px, mx, my) {
  const disc = (cx, cy, r, c) => {
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy))
      px(cx - w, cy + dy, c, 2 * w + 1, 1)
    }
  }
  disc(mx, my, 11, '#cfe3ec')
  disc(mx, my, 9, '#4a1d10')
  disc(mx, my, 7, '#1a0d08')
  px(mx - 6, my - 7, '#ffffff', 3, 1)
  px(mx - 8, my - 5, '#ffffff', 1, 2)
  // Fingers wrapped round the glass
  px(mx - 13, my - 4, '#f1b997', 3, 9)
  px(mx - 13, my - 4, '#d8977a', 1, 9)
  px(mx + 10, my - 2, '#f1b997', 2, 5)
}

// Cotton from the waist up at 2× scale, in one of three poses
function drawSeated(px, ox, oy, pose, f) {
  const p = (x, y, c, w = 1, h = 1) => px(ox + x * 2, oy + y * 2, c, w * 2, h * 2)
  const S = '#f1b997', s = '#d8977a', Hr = '#3b2a21', B = '#6e5246', M = '#2e1c14', E = '#2a1d1a'
  const T = '#f4efe8', t = '#d8d0c4', ink = '#3d4a5a'

  // Head: short dark hair, faded sides
  p(2, 0, Hr, 7, 1)
  p(1, 1, Hr, 9, 2)
  p(3, 0, '#5a4030', 3, 1)
  p(1, 3, '#5a4636')
  p(9, 3, '#5a4636')
  p(2, 3, S, 7, 7)
  p(1, 5, S, 1, 2)
  p(9, 5, S, 1, 2)
  p(3, 10, S, 5, 1)
  p(3, 4, Hr, 2, 1)
  p(6, 4, Hr, 2, 1)
  if (pose === 'drink') {
    p(3, 5, E, 2, 1) // eyes shut, savouring it
    p(6, 5, E, 2, 1)
  } else {
    p(4, 5, E)
    p(6, 5, E)
  }
  p(5, 6, s)
  for (let x = 2; x <= 8; x++) if (x % 2 === 0) p(x, 9, B)
  p(3, 10, B, 5, 1)
  p(4, 9, pose === 'cheer' ? '#7a2e2a' : '#9c5048', 3, 1)
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

  // Arms
  if (pose === 'drink') {
    // Arm raised, bringing the pint to his mouth (the glass is drawn over the hand)
    p(-2, 11, S, 2, 5)
    p(-2, 11, s, 1, 5)
    p(-1, 9, S, 3, 3)
    p(-1, 13, ink)
  } else if (pose === 'cheer') {
    // Both arms up: a perfect split!
    ;[-2, 11].forEach((x) => {
      p(x, 5, S, 2, 8)
      p(x - (x < 0 ? 1 : 0), 3, S, 3, 2)
    })
    p(-2, 9, ink)
    p(12, 10, ink)
    const k = f % 8
    ;['01010', '11111', '11111', '01110', '00100'].forEach((row, y) =>
      [...row].forEach((v, x) => v === '1' && px(ox + 26 + x, oy - 6 - k + y, '#ff2d95')),
    )
  } else {
    p(-1, 13, S, 2, 10)
    p(-1, 13, s, 1, 10)
    p(11, 13, S, 2, 10)
  }
  if (pose !== 'cheer') {
    ;[[0, 15], [-1, 16], [0, 17], [-1, 19]].forEach(([x, y]) => pose === 'rest' && p(x, y, ink))
    p(12, 15, ink)
    p(11, 17, ink)
  }
}

// ---------- Scoring ----------
function verdict(offset) {
  const a = Math.abs(offset)
  const mm = Math.max(1, Math.round(a * MM_PER_PX))
  const where = offset < 0 ? 'above' : 'below'
  if (a < WIN_MARGIN) return { win: true, text: 'Perfect split! Sláinte! 🍀' }
  if (a < WIN_MARGIN + 1.5) return { win: false, text: `So close! Just ${mm}mm ${where} the middle of the G.` }
  return { win: false, text: `${mm}mm ${where} the middle of the G. Have another go!` }
}

function loadBest() {
  try {
    const v = localStorage.getItem('splitTheG.best')
    return v === null ? null : Number(v)
  } catch {
    return null
  }
}

// Email the player their free-pint voucher (the server only ever emails their own account, once).
async function claimFreePint() {
  try {
    const { data, error } = await supabase.functions.invoke('split-the-g')
    if (error) return 'error'
    return data?.already ? 'already' : 'sent'
  } catch {
    return 'error'
  }
}

export default function SplitTheG({ user, children }) {
  const sectionRef = useRef(null)
  // Glass panels fade up into view as you scroll down to them
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 },
    )
    sectionRef.current.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  const [pintEmail, setPintEmail] = useState(null) // null | sending | sent | already | error | login
  const sceneRef = useRef(null)
  const canvasRef = useRef(null)
  const level = useRef(FULL)
  const phase = useRef('ready') // ready | lifting | drinking | lowering | done
  const phaseStart = useRef(0)
  const pending = useRef(null)
  const [ui, setUi] = useState('ready') // what the button and message show
  const [result, setResult] = useState(null)
  const [best, setBest] = useState(loadBest)
  const [layout, setLayout] = useState(null)

  const go = (next) => {
    phase.current = next
    phaseStart.current = performance.now()
  }

  // Match the scene's pixel width to the screen shape; on wide screens leave room on the left for the panel
  useEffect(() => {
    const el = sceneRef.current
    const update = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      const W = Math.max(150, Math.round((SH * w) / h))
      const wide = w >= 1000
      setLayout((prev) => (prev && prev.W === W && prev.wide === wide ? prev : { W, wide }))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!layout) return
    const canvas = canvasRef.current
    canvas.width = layout.W
    canvas.height = SH
    const ctx = canvas.getContext('2d')
    const pint = document.createElement('canvas')
    pint.width = PW
    pint.height = PH
    const pctx = pint.getContext('2d')
    const focus = layout.wide ? layout.W * 0.64 : layout.W * 0.5
    let raf = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = Math.min(1, (now - phaseStart.current) / LIFT_MS)
      if (phase.current === 'lifting' && k >= 1) {
        go('drinking')
        setUi('drinking')
      } else if (phase.current === 'drinking') {
        const e = (now - phaseStart.current) / 1000
        const speed = SPEED * Math.min(1, e / 0.35) * (1 + 0.2 * Math.sin(e * 9)) // gulping
        level.current += speed * dt
        if (level.current >= BOTTOM - 1) {
          level.current = BOTTOM
          pending.current = { win: false, text: 'You downed the whole pint! 🍺 Pour another and try again.' }
          go('lowering')
          setUi('lowering')
        }
      } else if (phase.current === 'lowering' && k >= 1) {
        go('done')
        setUi('done')
        setResult(pending.current)
      }
      drawPint(pctx, level.current, now / 1000)
      const pose =
        phase.current === 'drinking' ? 'drink' : phase.current === 'done' && pending.current?.win ? 'cheer' : 'rest'
      drawScene(ctx, layout.W, { t: now / 1000, focus, phase: phase.current, k, pose, pint })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [layout])

  function act() {
    if (phase.current === 'ready') {
      go('lifting')
      setUi('lifting')
      setResult(null)
      setPintEmail(null)
    } else if (phase.current === 'drinking') {
      const offset = level.current - TARGET
      pending.current = verdict(offset)
      if (pending.current.win) {
        if (user) {
          setPintEmail('sending')
          claimFreePint().then(setPintEmail)
        } else setPintEmail('login')
      }
      const mm = Math.round(Math.abs(offset) * MM_PER_PX * 10) / 10
      if (best === null || mm < best) {
        setBest(mm)
        try {
          localStorage.setItem('splitTheG.best', String(mm))
        } catch {
          // storage unavailable (private window): just don't remember it
        }
      }
      go('lowering')
      setUi('lowering')
    } else if (phase.current === 'done') {
      level.current = FULL
      pending.current = null
      go('ready')
      setUi('ready')
      setResult(null)
    }
  }

  const label = {
    ready: 'Pick up the pint',
    lifting: 'Cheers…',
    drinking: 'Put it down!',
    lowering: 'Let’s see…',
    done: 'Pour another',
  }[ui]
  const message = {
    lifting: 'Cheers!',
    drinking: 'Glug, glug, glug… you can’t see the level now!',
    lowering: 'Putting it down…',
  }[ui]

  return (
    <section className="lux todo-lux" ref={sectionRef}>
      {/* The bar scene stays pinned behind the page; clicks on it pick up / put down the pint */}
      <div className="lux-bg">
        <div className="pub-scene" ref={sceneRef} onClick={act}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Pixel-art scene: Cotton sits at a table on a seafront bar terrace with a pint of stout"
          />
        </div>
      </div>
      <div className="lux-content">
      <div className="lux-screen lux-game">
      <div className="pub-panel">
        <h2>Split the G</h2>
        <p className="mute">
          The classic Guinness challenge. Click to pick up the pint and start drinking, then click again to put it
          down. You can’t see the level while I’m drinking, so trust your timing! Win by stopping with the line between
          the black stout and the creamy head right on the middle of the G in GUINNESS.
        </p>
        <p className="game-rules-short">Tap to drink, tap to stop. Aim for the middle of the G!</p>
        <button
          className={'p' + (ui === 'drinking' ? ' gulping' : '')}
          onClick={act}
          disabled={ui === 'lifting' || ui === 'lowering'}
        >
          {label}
        </button>
        <p className={'game-result' + (result?.win ? ' win' : '')} aria-live="polite">
          {message || result?.text}
        </p>
        {ui === 'done' && pintEmail && (
          <p className="pint-email" aria-live="polite">
            {pintEmail === 'sending' && 'Sending your free-pint email…'}
            {pintEmail === 'sent' && `🍺 We’ve emailed ${user?.email}. Show it to your host on arrival for a free pint!`}
            {pintEmail === 'already' && 'You’ve already claimed your free pint, but well played!'}
            {pintEmail === 'error' && 'Couldn’t send your free-pint email just now. Please try again later.'}
            {pintEmail === 'login' && (
              <>
                <a href="#login">Log in</a> and split it again to get a free pint of Guinness on arrival!
              </>
            )}
          </p>
        )}
        {best !== null && (
          <p className="game-best">Your best: {best < WIN_MARGIN * MM_PER_PX ? 'a perfect split ✦' : `${best}mm off`}</p>
        )}
      </div>
      </div>
      {/* The rest of the page (Things to do panels) scrolls over the same scene */}
      {children}
      </div>
    </section>
  )
}
