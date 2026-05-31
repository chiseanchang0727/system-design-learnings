import { useState, useCallback } from 'react'
import styles from './Visualization.module.css'

// ─── shared hash (FNV-1a 32-bit, deterministic) ──────────────────────────────
const RING_SIZE = 2 ** 32

function ringHash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
    h >>>= 0
  }
  return h
}

// ─── simple hash router ───────────────────────────────────────────────────────
function simpleGetNode(key, nodes) {
  return nodes[ringHash(key) % nodes.length]
}

function buildAssignments(keys, nodes) {
  const out = {}
  for (const k of keys) out[k] = simpleGetNode(k, nodes)
  return out
}

// ─── hash ring ────────────────────────────────────────────────────────────────
function bisectLeft(arr, val) {
  let lo = 0, hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] < val) lo = mid + 1
    else hi = mid
  }
  return lo
}

class HashRing {
  constructor() {
    this.ring = {}       // pos -> node
    this.sorted = []     // sorted positions
  }
  addNode(node) {
    const pos = ringHash(node)
    this.ring[pos] = node
    const i = bisectLeft(this.sorted, pos)
    this.sorted.splice(i, 0, pos)
  }
  removeNode(node) {
    const pos = ringHash(node)
    delete this.ring[pos]
    const i = this.sorted.indexOf(pos)
    if (i !== -1) this.sorted.splice(i, 1)
  }
  getNode(key) {
    if (!this.sorted.length) return null
    const h = ringHash(key)
    let i = bisectLeft(this.sorted, h)
    if (i === this.sorted.length) i = 0
    return this.ring[this.sorted[i]]
  }
  snapshot() {
    return this.sorted.map(pos => ({ pos, node: this.ring[pos] }))
  }
}

// ─── svg helpers ─────────────────────────────────────────────────────────────
const CX = 200, CY = 200, R = 155

function posToAngle(pos) {
  return (pos / RING_SIZE) * 2 * Math.PI - Math.PI / 2
}

function angleToXY(angle, r = R) {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

// ─── constants ────────────────────────────────────────────────────────────────
const NODE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#f97316']
const NODE_NAMES  = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']
const DEFAULT_NODES = ['alpha', 'bravo', 'charlie']
const DEFAULT_KEYS  = ['session:user_42', 'session:user_99', 'product:789', 'order:001', 'cart:user_7', 'invoice:334', 'profile:user_18']

// ─── component ────────────────────────────────────────────────────────────────
export default function ConsistentHashingViz() {
  const [tab, setTab] = useState('ring')

  return (
    <div className={styles.root}>
      <div className={styles.tabs}>
        <button className={tab === 'simple' ? `${styles.tab} ${styles.tabActive}` : styles.tab} onClick={() => setTab('simple')}>
          Simple Hash Router
        </button>
        <button className={tab === 'ring' ? `${styles.tab} ${styles.tabActive}` : styles.tab} onClick={() => setTab('ring')}>
          Hash Ring
        </button>
      </div>
      {tab === 'simple' ? <SimpleRouterTab /> : <HashRingTab />}
    </div>
  )
}

// ─── simple router tab ────────────────────────────────────────────────────────
function SimpleRouterTab() {
  const [nodes, setNodes]           = useState(DEFAULT_NODES)
  const [keys]                      = useState(DEFAULT_KEYS)
  const [assignments, setAssign]    = useState(() => buildAssignments(DEFAULT_KEYS, DEFAULT_NODES))
  const [remapped, setRemapped]     = useState(new Set())
  const colorFor = node => NODE_COLORS[nodes.indexOf(node) % NODE_COLORS.length]

  const applyChange = (newNodes) => {
    const prev = assignments
    const next = buildAssignments(keys, newNodes)
    setRemapped(new Set(keys.filter(k => prev[k] !== next[k])))
    setNodes(newNodes)
    setAssign(next)
  }

  const addNode = () => {
    const name = NODE_NAMES[nodes.length] ?? `node-${nodes.length + 1}`
    applyChange([...nodes, name])
  }

  const removeNode = () => {
    if (nodes.length <= 1) return
    applyChange(nodes.slice(0, -1))
  }

  return (
    <div className={styles.tabContent}>
      <p className={styles.desc}>
        Each key is assigned via <code>hash(key) % num_nodes</code>. Adding or removing one server reshuffles most keys.
      </p>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.btn} onClick={addNode}>+ Add Node</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={removeNode} disabled={nodes.length <= 1}>− Remove Node</button>
          <span className={styles.muted}>{nodes.length} nodes</span>
        </div>
      </div>

      {remapped.size > 0 && (
        <div className={styles.banner}>
          <span className={styles.bannerNum}>{remapped.size}/{keys.length}</span> keys remapped after node change
        </div>
      )}

      <div className={styles.simpleLayout}>
        <div className={styles.keyTable}>
          <div className={styles.tableHead}><span>Key</span><span>Server</span></div>
          {keys.map(key => {
            const server = assignments[key]
            const color  = colorFor(server)
            const changed = remapped.has(key)
            return (
              <div key={key} className={`${styles.tableRow} ${changed ? styles.rowChanged : ''}`}>
                <span className={styles.keyName}>{key}</span>
                <span className={styles.badge} style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
                  {changed && <span className={styles.dot} />}
                  {server}
                </span>
              </div>
            )
          })}
        </div>

        <div className={styles.serverPanel}>
          <div className={styles.panelTitle}>Servers</div>
          {nodes.map((node, i) => {
            const color = NODE_COLORS[i % NODE_COLORS.length]
            const count = Object.values(assignments).filter(v => v === node).length
            return (
              <div key={node} className={styles.serverCard} style={{ borderLeftColor: color }}>
                <span className={styles.serverName}>{node}</span>
                <span className={styles.muted}>{count} keys</span>
                <div className={styles.loadBar}>
                  <div className={styles.loadFill} style={{ width: `${(count / keys.length) * 100}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── hash ring tab ────────────────────────────────────────────────────────────
function HashRingTab() {
  const [ring]                     = useState(() => {
    const r = new HashRing()
    DEFAULT_NODES.forEach(n => r.addNode(n))
    return r
  })
  const [nodeList, setNodeList]    = useState(DEFAULT_NODES)
  const [keys, setKeys]            = useState(DEFAULT_KEYS)
  const [, forceRender]            = useState(0)
  const [selectedKey, setSelected] = useState(null)
  const [remapped, setRemapped]    = useState(new Set())
  const [keyInput, setKeyInput]    = useState('')
  const colorFor = useCallback(node => {
    const i = nodeList.indexOf(node)
    return NODE_COLORS[i % NODE_COLORS.length]
  }, [nodeList])

  const rerender = () => forceRender(n => n + 1)

  const applyNodeChange = (newList, changeFn) => {
    const before = {}
    keys.forEach(k => { before[k] = ring.getNode(k) })
    changeFn()
    setNodeList(newList)
    const changed = new Set(keys.filter(k => ring.getNode(k) !== before[k]))
    setRemapped(changed)
    setTimeout(() => setRemapped(new Set()), 1500)
    rerender()
  }

  const addNode = () => {
    const name = NODE_NAMES[nodeList.length] ?? `node-${nodeList.length + 1}`
    applyNodeChange([...nodeList, name], () => ring.addNode(name))
  }

  const removeNode = () => {
    if (nodeList.length <= 1) return
    const name = nodeList[nodeList.length - 1]
    applyNodeChange(nodeList.slice(0, -1), () => ring.removeNode(name))
  }

  const addKey = () => {
    const k = keyInput.trim()
    if (!k || keys.includes(k)) return
    setKeys(prev => [...prev, k])
    setKeyInput('')
    rerender()
  }

  const ringSnap = ring.snapshot()

  return (
    <div className={styles.tabContent}>
      <p className={styles.desc}>
        Nodes and keys are placed on a ring by their hash. A key belongs to the first node clockwise from its position.
        Adding a node only moves ~1/N keys.
      </p>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.btn} onClick={addNode}>+ Add Node</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={removeNode} disabled={nodeList.length <= 1}>− Remove Node</button>
          <span className={styles.muted}>{nodeList.length} nodes</span>
        </div>
        <div className={styles.toolbarRight}>
          <input className={styles.input} placeholder="add key…" value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addKey()} />
          <button className={styles.btnGhost} onClick={addKey}>Add Key</button>
        </div>
      </div>

      {remapped.size > 0 && (
        <div className={styles.banner}>
          <span className={styles.bannerNum}>{remapped.size}/{keys.length}</span> keys remapped — only keys between the changed node and its predecessor moved
        </div>
      )}

      <div className={styles.ringLayout}>
        {/* ── SVG ring ── */}
        <svg className={styles.svg} viewBox="0 0 400 400">
          {/* ring circle */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />

          {/* key arcs — show selected key's path to node */}
          {selectedKey && (() => {
            const assignedNode = ring.getNode(selectedKey)
            if (!assignedNode) return null
            const kAngle = posToAngle(ringHash(selectedKey))
            const nAngle = posToAngle(ringHash(assignedNode))
            const [kx, ky] = angleToXY(kAngle)
            const [nx, ny] = angleToXY(nAngle)
            return (
              <line x1={kx} y1={ky} x2={nx} y2={ny}
                stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 3" />
            )
          })()}

          {/* key dots */}
          {keys.map(key => {
            const angle    = posToAngle(ringHash(key))
            const [x, y]   = angleToXY(angle)
            const node     = ring.getNode(key)
            const color    = node ? colorFor(node) : '#fff'
            const isSelected = selectedKey === key
            const isRemapped = remapped.has(key)
            return (
              <g key={key} onClick={() => setSelected(selectedKey === key ? null : key)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={isSelected ? 7 : 5}
                  fill={isRemapped ? 'var(--danger)' : color}
                  stroke={isSelected ? '#fff' : 'var(--bg)'}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={isRemapped ? 1 : 0.85}
                />
              </g>
            )
          })}

          {/* node dots */}
          {ringSnap.map(({ pos, node }) => {
            const angle  = posToAngle(pos)
            const [x, y] = angleToXY(angle)
            const color  = colorFor(node)
            const isAssigned = selectedKey && ring.getNode(selectedKey) === node
            const label  = node.replace('cache-server-', 'S')
            const [lx, ly] = angleToXY(angle, R + 22)
            return (
              <g key={pos}>
                <circle cx={x} cy={y} r={14}
                  fill={color}
                  stroke={isAssigned ? '#fff' : 'var(--bg)'}
                  strokeWidth={isAssigned ? 2.5 : 1.5}
                />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontSize="10" fontWeight="700" fill="#fff">{label}</text>
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                  fontSize="9" fill="var(--text-muted)">{node.replace('cache-server-', 'srv-')}</text>
              </g>
            )
          })}

          {/* center label */}
          <text x={CX} y={CY - 8} textAnchor="middle" fontSize="11" fill="var(--text-muted)">Hash Ring</text>
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">{nodeList.length} nodes · {keys.length} keys</text>
        </svg>

        {/* ── key list ── */}
        <div className={styles.ringSide}>
          <div className={styles.panelTitle}>Keys — click to trace</div>
          {keys.map(key => {
            const node  = ring.getNode(key)
            const color = node ? colorFor(node) : '#fff'
            const isSelected = selectedKey === key
            const isRemapped = remapped.has(key)
            return (
              <div key={key}
                className={`${styles.keyRow} ${isSelected ? styles.keyRowSelected : ''} ${isRemapped ? styles.keyRowRemapped : ''}`}
                onClick={() => setSelected(selectedKey === key ? null : key)}
              >
                <span className={styles.keyDot} style={{ background: isRemapped ? 'var(--danger)' : color }} />
                <span className={styles.keyName}>{key}</span>
                <span className={styles.keyNode} style={{ color }}>{node}</span>
              </div>
            )
          })}

          <div className={styles.panelTitle} style={{ marginTop: 16 }}>Nodes</div>
          {nodeList.map((node, i) => {
            const color = NODE_COLORS[i % NODE_COLORS.length]
            const count = keys.filter(k => ring.getNode(k) === node).length
            return (
              <div key={node} className={styles.serverCard} style={{ borderLeftColor: color }}>
                <span className={styles.serverName}>{node}</span>
                <span className={styles.muted}>{count} keys</span>
                <div className={styles.loadBar}>
                  <div className={styles.loadFill} style={{ width: `${keys.length ? (count / keys.length) * 100 : 0}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
