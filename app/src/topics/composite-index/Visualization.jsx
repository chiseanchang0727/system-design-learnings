import { useState } from 'react'
import styles from './Visualization.module.css'

// ─── data ─────────────────────────────────────────────────────────────────────
const ROWS = [
  { last_name: 'Brown',   first_name: 'Alice', age: 22, city: 'SF'  },
  { last_name: 'Brown',   first_name: 'Frank', age: 38, city: 'LA'  },
  { last_name: 'Johnson', first_name: 'Dave',  age: 31, city: 'NYC' },
  { last_name: 'Johnson', first_name: 'Eve',   age: 25, city: 'NYC' },
  { last_name: 'Smith',   first_name: 'Bob',   age: 35, city: 'LA'  },
  { last_name: 'Smith',   first_name: 'Carol', age: 28, city: 'NYC' },
  { last_name: 'Smith',   first_name: 'Dan',   age: 42, city: 'SF'  },
  { last_name: 'Taylor',  first_name: 'Grace', age: 33, city: 'LA'  },
  { last_name: 'Taylor',  first_name: 'Henry', age: 45, city: 'NYC' },
  { last_name: 'Wilson',  first_name: 'Iris',  age: 29, city: 'SF'  },
]

const ALL_COLS   = ['last_name', 'first_name', 'age', 'city']
const STRING_COLS = new Set(['last_name', 'first_name', 'city'])

// ─── presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  {
    label: 'Equality on leading column',
    indexCols: ['last_name', 'first_name', 'age'],
    conditions: [{ id: 1, col: 'last_name', op: '=', value: 'Smith' }],
  },
  {
    label: 'Full prefix match',
    indexCols: ['last_name', 'first_name', 'age'],
    conditions: [
      { id: 1, col: 'last_name', op: '=', value: 'Smith' },
      { id: 2, col: 'first_name', op: '=', value: 'Bob' },
    ],
  },
  {
    label: 'Range after equality',
    indexCols: ['last_name', 'age', 'first_name'],
    conditions: [
      { id: 1, col: 'last_name', op: '=', value: 'Smith' },
      { id: 2, col: 'age', op: '>', value: '30' },
    ],
  },
  {
    label: 'Skips leading column',
    indexCols: ['last_name', 'first_name', 'age'],
    conditions: [{ id: 1, col: 'first_name', op: '=', value: 'Bob' }],
  },
]

// ─── analysis ─────────────────────────────────────────────────────────────────
function conditionMatches(cond, row) {
  const v = row[cond.col]
  const cv = cond.value.trim()
  if (!cv) return true
  if (cond.op === '=')      return String(v).toLowerCase() === cv.toLowerCase()
  if (cond.op === '>')      return Number(v) > Number(cv)
  if (cond.op === '<')      return Number(v) < Number(cv)
  if (cond.op === 'starts') return String(v).toLowerCase().startsWith(cv.toLowerCase())
  return false
}

function analyzeUsage(indexCols, conditions) {
  const usage = []
  let active = true
  for (const col of indexCols) {
    if (!active) { usage.push({ col, status: 'unused' }); continue }
    const cond = conditions.find(c => c.col === col && c.value.trim() !== '')
    if (!cond)           { usage.push({ col, status: 'skip'  }); active = false }
    else if (cond.op === '=') { usage.push({ col, status: 'seek'  }) }
    else                 { usage.push({ col, status: 'range' }); active = false }
  }
  const isFullScan = usage.length === 0 || usage[0].status === 'skip' || usage[0].status === 'unused'
  return { usage, isFullScan }
}

function classifyRow(row, conditions, usage, isFullScan) {
  if (isFullScan) return 'fullscan'
  const allMatch = conditions.filter(c => c.value.trim()).every(c => conditionMatches(c, row))
  const seekCols = usage.filter(u => u.status === 'seek')
  const inSeek   = seekCols.every(u => {
    const cond = conditions.find(c => c.col === u.col)
    return cond && conditionMatches(cond, row)
  })
  if (!inSeek) return 'outside'
  return allMatch ? 'match' : 'scanned'
}

function sortedRows(indexCols) {
  return [...ROWS].sort((a, b) => {
    for (const col of indexCols) {
      if (a[col] < b[col]) return -1
      if (a[col] > b[col]) return 1
    }
    return 0
  })
}

// ─── labels ───────────────────────────────────────────────────────────────────
const STATUS_LABEL = {
  seek:    'SEEK',
  range:   'RANGE',
  skip:    'NO CONDITION — stops here',
  unused:  'UNUSED',
}

const STATUS_DESC = {
  seek:    'equality — seeks directly into index',
  range:   '>, < or prefix — seeks to start, then scans',
  skip:    'no condition on this column; breaks the chain',
  unused:  'unreachable — a gap or range broke the chain earlier',
}

// ─── component ────────────────────────────────────────────────────────────────
let _nextId = 10

export default function CompositeIndexViz() {
  const [indexCols, setIndexCols]   = useState(['last_name', 'first_name', 'age'])
  const [conditions, setConditions] = useState(PRESETS[0].conditions)

  const loadPreset = (p) => {
    setIndexCols([...p.indexCols])
    setConditions(p.conditions.map(c => ({ ...c })))
  }

  const moveCol = (i, dir) => {
    const cols = [...indexCols]
    const j = i + dir
    if (j < 0 || j >= cols.length) return
    ;[cols[i], cols[j]] = [cols[j], cols[i]]
    setIndexCols(cols)
  }

  const addCond = () => {
    const col = ALL_COLS.find(c => !conditions.some(x => x.col === c)) ?? 'age'
    const op  = STRING_COLS.has(col) ? '=' : '>'
    setConditions(prev => [...prev, { id: _nextId++, col, op, value: '' }])
  }

  const removeCond = (id) => setConditions(prev => prev.filter(c => c.id !== id))

  const updateCond = (id, field, value) => {
    setConditions(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = { ...c, [field]: value }
      if (field === 'col') {
        next.op    = STRING_COLS.has(value) ? '=' : '>'
        next.value = ''
      }
      return next
    }))
  }

  const { usage, isFullScan } = analyzeUsage(indexCols, conditions)
  const rows = sortedRows(indexCols)
  const classified = rows.map(row => classifyRow(row, conditions, usage, isFullScan))
  const matchCount   = classified.filter(s => s === 'match').length
  const scannedCount = classified.filter(s => s === 'scanned').length

  const nonIndexCols = ALL_COLS.filter(c => !indexCols.includes(c))

  return (
    <div className={styles.root}>
      {/* presets */}
      <div className={styles.presets}>
        {PRESETS.map(p => (
          <button
            key={p.label}
            className={styles.preset}
            onClick={() => loadPreset(p)}
          >{p.label}</button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* ── left: controls ── */}
        <div className={styles.controls}>

          {/* index definition */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>INDEX ON employees</div>
            {indexCols.map((col, i) => (
              <div key={col} className={styles.indexRow}>
                <span className={styles.indexNum}>{i + 1}</span>
                <span className={styles.indexCol}>{col}</span>
                <button className={styles.moveBtn} onClick={() => moveCol(i, -1)} disabled={i === 0}>↑</button>
                <button className={styles.moveBtn} onClick={() => moveCol(i, 1)}  disabled={i === indexCols.length - 1}>↓</button>
              </div>
            ))}
          </div>

          {/* where conditions */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>WHERE</div>
            {conditions.map((cond, i) => (
              <div key={cond.id} className={styles.condRow}>
                {i > 0 && <span className={styles.andLabel}>AND</span>}
                <select
                  className={styles.select}
                  value={cond.col}
                  onChange={e => updateCond(cond.id, 'col', e.target.value)}
                >
                  {ALL_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className={styles.select}
                  value={cond.op}
                  onChange={e => updateCond(cond.id, 'op', e.target.value)}
                >
                  {STRING_COLS.has(cond.col)
                    ? <><option value="=">  =  </option><option value="starts">starts with</option></>
                    : <><option value="=">  =  </option><option value=">">&gt;</option><option value="<">&lt;</option></>
                  }
                </select>
                <input
                  className={styles.valInput}
                  value={cond.value}
                  placeholder={STRING_COLS.has(cond.col) ? 'Smith' : '30'}
                  onChange={e => updateCond(cond.id, 'value', e.target.value)}
                />
                <button className={styles.removeBtn} onClick={() => removeCond(cond.id)}>×</button>
              </div>
            ))}
            <button className={styles.addBtn} onClick={addCond}>+ AND</button>
          </div>

          {/* index usage */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>INDEX USAGE</div>
            {usage.map(u => (
              <div key={u.col} className={styles.usageRow}>
                <span className={`${styles.usageDot} ${styles[`dot_${u.status}`]}`} />
                <span className={styles.usageColName}>{u.col}</span>
                <span className={`${styles.usageTag} ${styles[`tag_${u.status}`]}`}>{STATUS_LABEL[u.status]}</span>
              </div>
            ))}
            {usage.length > 0 && (
              <p className={styles.usageDesc}>
                {isFullScan
                  ? 'No index benefit — full table scan required.'
                  : STATUS_DESC[usage.find(u => u.status !== 'seek')?.status ?? 'seek']
                }
              </p>
            )}
          </div>

        </div>

        {/* ── right: sorted index table ── */}
        <div className={styles.tableWrap}>
          {isFullScan && (
            <div className={styles.scanBanner}>
              Full table scan — index can't be used when the leading column has no condition
            </div>
          )}

          {!isFullScan && (
            <div className={styles.summary}>
              <span className={styles.sumMatch}>{matchCount} matched</span>
              <span className={styles.sumDot}>·</span>
              <span className={styles.sumScanned}>{scannedCount} scanned</span>
              <span className={styles.sumDot}>·</span>
              <span className={styles.sumOutside}>{10 - matchCount - scannedCount} skipped by index</span>
            </div>
          )}

          <table className={styles.table}>
            <thead>
              <tr>
                {indexCols.map(col => <th key={col}>{col}</th>)}
                {nonIndexCols.map(col => (
                  <th key={col} className={styles.dimHead}>{col}</th>
                ))}
                <th className={styles.statusHead}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const status = classified[i]
                return (
                  <tr key={i} className={`${styles.row} ${styles[`row_${status}`]}`}>
                    {indexCols.map(col => <td key={col}>{row[col]}</td>)}
                    {nonIndexCols.map(col => (
                      <td key={col} className={styles.dimCell}>{row[col]}</td>
                    ))}
                    <td className={styles.statusCell}>
                      {status === 'match'    && <span className={styles.tagMatch}>✓ returned</span>}
                      {status === 'scanned'  && <span className={styles.tagScanned}>~ scanned</span>}
                      {status === 'outside'  && <span className={styles.tagOutside}>─ skipped</span>}
                      {status === 'fullscan' && <span className={styles.tagOutside}>~ full scan</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
