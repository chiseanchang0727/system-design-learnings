import { useState, useCallback } from 'react'
import styles from './Visualization.module.css'

// ─── fixed sample points on 400×400 grid ──────────────────────────────────────
const POINTS = [
  { id: 1,  x: 55,  y: 60  }, { id: 2,  x: 120, y: 45  }, { id: 3,  x: 190, y: 90  },
  { id: 4,  x: 260, y: 55  }, { id: 5,  x: 340, y: 80  }, { id: 6,  x: 80,  y: 160 },
  { id: 7,  x: 165, y: 185 }, { id: 8,  x: 220, y: 155 }, { id: 9,  x: 290, y: 200 },
  { id: 10, x: 360, y: 170 }, { id: 11, x: 60,  y: 280 }, { id: 12, x: 140, y: 310 },
  { id: 13, x: 210, y: 260 }, { id: 14, x: 300, y: 300 }, { id: 15, x: 370, y: 320 },
]

// ─── quad (S2-style) ──────────────────────────────────────────────────────────
function getQuadCells(res) {
  const n = 2 ** res, size = 400 / n
  const cells = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      cells.push({ id: `${r}-${c}`, x: c * size, y: r * size, w: size, h: size })
  return cells
}

function quadCellId(px, py, res) {
  const size = 400 / (2 ** res)
  return `${Math.floor(py / size)}-${Math.floor(px / size)}`
}

function quadCovering(cx, cy, radius, res) {
  const n = 2 ** res, size = 400 / n, out = new Set()
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const nx = Math.max(c * size, Math.min((c + 1) * size, cx))
    const ny = Math.max(r * size, Math.min((r + 1) * size, cy))
    if (Math.hypot(cx - nx, cy - ny) <= radius) out.add(`${r}-${c}`)
  }
  return out
}

// ─── hex (H3-style) ───────────────────────────────────────────────────────────
const HEX_SIZE = [0, 105, 54, 27, 14]

function hexPts(cx, cy, s) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + s * Math.cos(a)},${cy + s * Math.sin(a)}`
  }).join(' ')
}

function getHexCells(res) {
  const s = HEX_SIZE[res]
  const W = Math.sqrt(3) * s, rowH = s * 1.5
  const cells = []
  for (let r = -1; r < Math.ceil(400 / rowH) + 2; r++) {
    for (let c = -1; c < Math.ceil(400 / W) + 2; c++) {
      const cx = c * W + (r % 2 !== 0 ? W / 2 : 0)
      const cy = r * rowH
      if (cx + s < -10 || cx - s > 410 || cy + s < -10 || cy - s > 410) continue
      cells.push({ id: `${r}-${c}`, cx, cy, s, pts: hexPts(cx, cy, s) })
    }
  }
  return cells
}

function hexCellId(px, py, cells) {
  let best = null, bestD = Infinity
  for (const c of cells) {
    const d = Math.hypot(px - c.cx, py - c.cy)
    if (d < bestD) { bestD = d; best = c.id }
  }
  return best
}

function hexCovering(cx, cy, radius, cells) {
  const out = new Set()
  for (const c of cells)
    if (Math.hypot(cx - c.cx, cy - c.cy) <= radius + c.s) out.add(c.id)
  return out
}

// ─── component ────────────────────────────────────────────────────────────────
export default function S2H3Viz() {
  const [mode, setMode]       = useState('quad')
  const [res,  setRes]        = useState(3)
  const [center, setCenter]   = useState({ x: 200, y: 180 })
  const [radius, setRadius]   = useState(100)

  const cells    = mode === 'quad' ? getQuadCells(res) : getHexCells(res)
  const covering = mode === 'quad'
    ? quadCovering(center.x, center.y, radius, res)
    : hexCovering(center.x, center.y, radius, cells)

  const classified = POINTS.map(p => {
    const cellId    = mode === 'quad' ? quadCellId(p.x, p.y, res) : hexCellId(p.x, p.y, cells)
    const inCover   = covering.has(cellId)
    const inRadius  = Math.hypot(p.x - center.x, p.y - center.y) <= radius
    const status    = inRadius ? 'match' : inCover ? 'fp' : 'outside'
    return { ...p, status }
  })

  const nMatch   = classified.filter(p => p.status === 'match').length
  const nFP      = classified.filter(p => p.status === 'fp').length
  const nSkipped = classified.filter(p => p.status === 'outside').length

  const handleClick = useCallback(e => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = 400 / rect.width
    setCenter({ x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale })
  }, [])

  return (
    <div className={styles.root}>
      <p className={styles.desc}>
        S2 and H3 encode (lat, lng) as a <strong>cell ID</strong> — a plain integer you can index in a database.
        A nearby query becomes: find all cells covering the search radius, then look up those IDs.
        <strong> Click the grid</strong> to move the query center.
      </p>

      <div className={styles.controls}>
        <div className={styles.toggle}>
          <button className={`${styles.toggleBtn} ${mode === 'quad' ? styles.toggleActive : ''}`} onClick={() => setMode('quad')}>
            S2-style (quad)
          </button>
          <button className={`${styles.toggleBtn} ${mode === 'hex' ? styles.toggleActive : ''}`} onClick={() => setMode('hex')}>
            H3-style (hex)
          </button>
        </div>

        <label className={styles.sliderWrap}>
          <span>Resolution <strong>{res}</strong></span>
          <input type="range" min={1} max={4} value={res} onChange={e => setRes(+e.target.value)} className={styles.slider} />
          <span className={styles.muted}>coarser ← → finer</span>
        </label>

        <label className={styles.sliderWrap}>
          <span>Radius <strong>{radius}px</strong></span>
          <input type="range" min={30} max={200} value={radius} onChange={e => setRadius(+e.target.value)} className={styles.slider} />
        </label>
      </div>

      <div className={styles.stats}>
        <span className={styles.statMatch}>{nMatch} matched</span>
        <span className={styles.sep}>·</span>
        <span className={styles.statFP}>{nFP} false positive{nFP !== 1 ? 's' : ''}</span>
        <span className={styles.sep}>·</span>
        <span className={styles.statSkip}>{nSkipped} skipped</span>
        <span className={styles.sep}>·</span>
        <span className={styles.statCells}>{covering.size} / {cells.length} cells checked</span>
      </div>

      <svg viewBox="0 0 400 400" className={styles.svg} onClick={handleClick} style={{ cursor: 'crosshair' }}>
        {/* grid cells */}
        {cells.map(cell => {
          const covered = covering.has(cell.id)
          return mode === 'quad' ? (
            <rect key={cell.id} x={cell.x} y={cell.y} width={cell.w} height={cell.h}
              fill={covered ? 'rgba(99,102,241,0.18)' : 'transparent'}
              stroke={covered ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.07)'}
              strokeWidth={covered ? 1.5 : 0.5}
            />
          ) : (
            <polygon key={cell.id} points={cell.pts}
              fill={covered ? 'rgba(99,102,241,0.18)' : 'transparent'}
              stroke={covered ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.07)'}
              strokeWidth={covered ? 1.5 : 0.5}
            />
          )
        })}

        {/* search radius */}
        <circle cx={center.x} cy={center.y} r={radius}
          fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeDasharray="6 3" />

        {/* points */}
        {classified.map(p => {
          const color = p.status === 'match' ? '#22c55e' : p.status === 'fp' ? '#f59e0b' : '#334155'
          const stroke = p.status === 'outside' ? 'rgba(255,255,255,0.15)' : 'var(--bg)'
          return (
            <circle key={p.id} cx={p.x} cy={p.y} r={5}
              fill={color} stroke={stroke} strokeWidth="1.5" />
          )
        })}

        {/* center marker */}
        <circle cx={center.x} cy={center.y} r={3.5} fill="white" opacity={0.85} />
        <line x1={center.x - 9} y1={center.y} x2={center.x + 9} y2={center.y} stroke="white" strokeWidth="1" opacity={0.5} />
        <line x1={center.x} y1={center.y - 9} x2={center.x} y2={center.y + 9} stroke="white" strokeWidth="1" opacity={0.5} />
      </svg>

      <div className={styles.legend}>
        <span><span className={styles.dotMatch} /> inside radius (returned)</span>
        <span><span className={styles.dotFP} /> false positive — in covered cell but outside radius</span>
        <span><span className={styles.dotSkip} /> skipped entirely by index</span>
      </div>

      <p className={styles.insight}>
        Lower resolution → fewer cells to query but more false positives. Higher resolution → precise coverage but more cell IDs in the query.
        This is the core trade-off when choosing an H3/S2 resolution for your index.
      </p>
    </div>
  )
}
