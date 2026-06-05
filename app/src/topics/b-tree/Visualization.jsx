import { useState } from 'react'
import styles from './Visualization.module.css'

// ─── B-tree (min degree t=2 → max 3 keys, 4 children per node) ───────────────
class BTreeNode {
  constructor(leaf = true) {
    this.keys = []
    this.children = []
    this.leaf = leaf
  }
}

class BTree {
  constructor(t = 2) {
    this.t = t
    this.root = new BTreeNode(true)
  }

  insert(k) {
    const r = this.root
    if (r.keys.length === 2 * this.t - 1) {
      const s = new BTreeNode(false)
      s.children = [r]
      this._splitChild(s, 0)
      this.root = s
    }
    this._insertNonFull(this.root, k)
  }

  _insertNonFull(node, k) {
    let i = node.keys.length - 1
    if (node.leaf) {
      node.keys.push(null)
      while (i >= 0 && k < node.keys[i]) { node.keys[i + 1] = node.keys[i]; i-- }
      node.keys[i + 1] = k
    } else {
      while (i >= 0 && k < node.keys[i]) i--
      i++
      if (node.children[i].keys.length === 2 * this.t - 1) {
        this._splitChild(node, i)
        if (k > node.keys[i]) i++
      }
      this._insertNonFull(node.children[i], k)
    }
  }

  _splitChild(parent, i) {
    const t = this.t
    const y = parent.children[i]
    const z = new BTreeNode(y.leaf)
    z.keys = y.keys.splice(t)
    const promoted = y.keys.pop()
    if (!y.leaf) z.children = y.children.splice(t)
    parent.children.splice(i + 1, 0, z)
    parent.keys.splice(i, 0, promoted)
  }
}

// ─── layout ───────────────────────────────────────────────────────────────────
const KEY_W = 32
const KEY_H = 36
const PAD_X = 12
const LEVEL_H = 80
const GAP = 24

function nodeW(node) {
  return Math.max(1, node.keys.length) * KEY_W + PAD_X * 2
}

function subtreeW(node) {
  if (!node.children.length) return nodeW(node)
  const w = node.children.reduce((s, c) => s + subtreeW(c), 0) + GAP * (node.children.length - 1)
  return Math.max(nodeW(node), w)
}

function computeLayout(root) {
  const nodes = []
  const edges = []
  let maxY = 0

  function place(node, leftX, y) {
    const sw = subtreeW(node)
    const nw = nodeW(node)
    const cx = leftX + sw / 2
    nodes.push({ node, x: cx - nw / 2, y, w: nw, cx })
    if (y > maxY) maxY = y

    if (node.children.length) {
      const childrenW = node.children.reduce((s, c) => s + subtreeW(c), 0) + GAP * (node.children.length - 1)
      let childX = leftX + (sw - childrenW) / 2
      for (const child of node.children) {
        const csw = subtreeW(child)
        const childCX = childX + csw / 2
        edges.push({ x1: cx, y1: y + KEY_H, x2: childCX, y2: y + LEVEL_H })
        place(child, childX, y + LEVEL_H)
        childX += csw + GAP
      }
    }
  }

  place(root, 0, 0)
  return { nodes, edges, totalW: subtreeW(root), totalH: maxY + KEY_H }
}

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 5]

function makeTree() {
  const t = new BTree(2)
  const seen = new Set()
  for (const v of DEFAULT_VALUES) { t.insert(v); seen.add(v) }
  return { tree: t, inserted: seen }
}

// ─── component ────────────────────────────────────────────────────────────────
export default function BTreeViz() {
  const [{ tree, inserted }] = useState(makeTree)
  const [, forceRender] = useState(0)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const insert = () => {
    const k = parseInt(input, 10)
    if (isNaN(k)) { setError('enter a number'); return }
    if (inserted.has(k)) { setError(`${k} already in tree`); return }
    inserted.add(k)
    tree.insert(k)
    forceRender(n => n + 1)
    setInput('')
    setError('')
  }

  const reset = () => {
    const fresh = makeTree()
    tree.root = fresh.tree.root
    inserted.clear()
    for (const v of fresh.inserted) inserted.add(v)
    forceRender(n => n + 1)
    setError('')
  }

  const { nodes, edges, totalW, totalH } = computeLayout(tree.root)
  const PAD = 24
  const vbW = totalW + PAD * 2
  const vbH = totalH + PAD * 2

  return (
    <div className={styles.root}>
      <p className={styles.desc}>
        Each node holds up to {2 * tree.t - 1} keys. When a node is full and a new key arrives,
        it splits — the middle key bubbles up to the parent, keeping all leaves at the same depth.
      </p>

      <div className={styles.toolbar}>
        <input
          className={styles.input}
          placeholder="number…"
          value={input}
          onChange={e => { setInput(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && insert()}
        />
        <button className={styles.btn} onClick={insert}>Insert</button>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={reset}>Reset</button>
        {error && <span className={styles.error}>{error}</span>}
      </div>

      <div className={styles.svgWrap}>
        <svg viewBox={`${-PAD} ${-PAD} ${vbW} ${vbH}`} width={vbW} height={vbH}>
          {edges.map((e, i) => (
            <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="var(--border)" strokeWidth="1.5" />
          ))}
          {nodes.map(({ node, x, y, w }, ni) => (
            <g key={ni}>
              <rect x={x} y={y} width={w} height={KEY_H} rx={5}
                fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
              {node.keys.map((k, i) => (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={x + PAD_X + i * KEY_W} y1={y + 6}
                      x2={x + PAD_X + i * KEY_W} y2={y + KEY_H - 6}
                      stroke="var(--border)" strokeWidth="1"
                    />
                  )}
                  <text
                    x={x + PAD_X + (i + 0.5) * KEY_W} y={y + KEY_H / 2}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="12" fontWeight="600" fill="var(--text)"
                  >{k}</text>
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
