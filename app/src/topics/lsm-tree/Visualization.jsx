import { useState } from 'react'
import styles from './Visualization.module.css'

// ─── constants ────────────────────────────────────────────────────────────────
const MEM_CAPACITY = 5

// ─── initial state: two SSTables with overlapping keys ───────────────────────
const INIT_SSTABLES = [
  { id: 2, entries: [{ key: 'c', value: '30' }, { key: 'd', value: '40' }, { key: 'e', value: '50' }] },
  { id: 1, entries: [{ key: 'a', value: '10' }, { key: 'b', value: '20' }, { key: 'c', value: 'old' }] },
]
const INIT_MEMTABLE = [{ key: 'f', value: '60' }, { key: 'g', value: '70' }]

// ─── helpers ──────────────────────────────────────────────────────────────────
function sortedInsert(entries, key, value) {
  const next = entries.filter(e => e.key !== key)
  next.push({ key, value })
  return next.sort((a, b) => a.key.localeCompare(b.key))
}

function isStale(key, sstableIdx, memTable, sstables) {
  if (memTable.some(e => e.key === key)) return true
  for (let i = 0; i < sstableIdx; i++) {
    if (sstables[i].entries.some(e => e.key === key)) return true
  }
  return false
}

// ─── component ────────────────────────────────────────────────────────────────
let _ssId = 100

export default function LSMTreeViz() {
  const [memTable, setMemTable]   = useState(INIT_MEMTABLE)
  const [sstables, setSSTables]   = useState(INIT_SSTABLES)
  const [writeKey, setWriteKey]   = useState('')
  const [writeVal, setWriteVal]   = useState('')
  const [readKey, setReadKey]     = useState('')
  const [readResult, setReadResult] = useState(null) // { key, foundIn: 'mem'|number|null }
  const [lastFlushed, setLastFlushed] = useState(null) // sstable id just flushed, for highlight

  // ── write ──
  const doWrite = (key = writeKey.trim(), value = writeVal.trim()) => {
    if (!key) return
    setReadResult(null)
    const newMem = sortedInsert(memTable, key, value || '∅')
    if (newMem.length >= MEM_CAPACITY) {
      const newId = _ssId++
      setSSTables(prev => [{ id: newId, entries: newMem }, ...prev])
      setLastFlushed(newId)
      setTimeout(() => setLastFlushed(null), 1200)
      setMemTable([])
    } else {
      setMemTable(newMem)
    }
    setWriteKey('')
    setWriteVal('')
  }

  // ── delete (tombstone) ──
  const doDelete = (key = writeKey.trim()) => {
    if (!key) return
    doWrite(key, '∅')
  }

  // ── read ──
  const doRead = () => {
    const key = readKey.trim()
    if (!key) return
    const memHit = memTable.find(e => e.key === key)
    if (memHit) { setReadResult({ key, foundIn: 'mem', value: memHit.value }); return }
    for (let i = 0; i < sstables.length; i++) {
      const hit = sstables[i].entries.find(e => e.key === key)
      if (hit) { setReadResult({ key, foundIn: i, value: hit.value }); return }
    }
    setReadResult({ key, foundIn: null })
  }

  // ── compact ──
  const doCompact = () => {
    if (sstables.length < 2) return
    setReadResult(null)
    const merged = {}
    for (let i = sstables.length - 1; i >= 0; i--) {
      for (const { key, value } of sstables[i].entries) merged[key] = value
    }
    const entries = Object.entries(merged)
      .filter(([, v]) => v !== '∅')
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => a.key.localeCompare(b.key))
    const newId = _ssId++
    setSSTables([{ id: newId, entries }])
    setLastFlushed(newId)
    setTimeout(() => setLastFlushed(null), 1200)
  }

  // ── read status helpers ──
  const memStatus = () => {
    if (!readResult) return 'idle'
    if (readResult.foundIn === 'mem') return 'found'
    return 'checked'
  }
  const sstableStatus = (i) => {
    if (!readResult) return 'idle'
    if (readResult.foundIn === i) return 'found'
    if (typeof readResult.foundIn === 'number' && i < readResult.foundIn) return 'checked'
    if (readResult.foundIn === null) return 'checked'
    return 'idle'
  }

  return (
    <div className={styles.root}>
      <p className={styles.desc}>
        All writes land in the <strong>MemTable</strong> (memory). When it fills up it flushes to an immutable <strong>SSTable</strong> on disk.
        Reads search newest → oldest, stopping at the first hit. <strong>Compaction</strong> merges SSTables and discards stale values.
      </p>

      {/* toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <input className={styles.input} placeholder="key" value={writeKey}
            onChange={e => setWriteKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doWrite()} />
          <input className={styles.input} placeholder="value" value={writeVal}
            onChange={e => setWriteVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doWrite()} />
          <button className={styles.btn} onClick={() => doWrite()}>Write</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => doDelete()}>Delete</button>
        </div>
        <div className={styles.toolGroup}>
          <input className={styles.input} placeholder="key" value={readKey}
            onChange={e => { setReadKey(e.target.value); setReadResult(null) }}
            onKeyDown={e => e.key === 'Enter' && doRead()} />
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={doRead}>Read</button>
        </div>
        <button
          className={`${styles.btn} ${styles.btnCompact}`}
          onClick={doCompact}
          disabled={sstables.length < 2}
        >Compact SSTables</button>
      </div>

      {/* read result banner */}
      {readResult && (
        <div className={readResult.foundIn !== null ? styles.foundBanner : styles.missBanner}>
          {readResult.foundIn === null
            ? `"${readResult.key}" not found — searched all ${1 + sstables.length} locations`
            : readResult.value === '∅'
              ? `"${readResult.key}" was deleted (tombstone found in ${readResult.foundIn === 'mem' ? 'MemTable' : `SSTable-${sstables.length - (readResult.foundIn)}` })`
              : `"${readResult.key}" = ${readResult.value}  —  found in ${readResult.foundIn === 'mem' ? 'MemTable' : `SSTable-${sstables.length - (readResult.foundIn)}`}`
          }
        </div>
      )}

      {/* data layers */}
      <div className={styles.layers}>

        {/* MemTable */}
        <div className={`${styles.layer} ${styles.memLayer} ${memStatus() === 'found' ? styles.layerFound : memStatus() === 'checked' ? styles.layerChecked : ''}`}>
          <div className={styles.layerHeader}>
            <span className={styles.layerLabel}>MemTable</span>
            <span className={styles.layerMeta}>memory · {memTable.length}/{MEM_CAPACITY}</span>
            <div className={styles.fillBar}>
              <div className={styles.fillFill} style={{ width: `${(memTable.length / MEM_CAPACITY) * 100}%` }} />
            </div>
          </div>
          <div className={styles.entries}>
            {memTable.length === 0
              ? <span className={styles.empty}>empty — waiting for writes</span>
              : memTable.map(({ key, value }) => (
                <div key={key} className={`${styles.entry} ${readResult?.foundIn === 'mem' && readResult.key === key ? styles.entryHit : ''}`}>
                  <span className={styles.eKey}>{key}</span>
                  <span className={styles.eArrow}>→</span>
                  <span className={value === '∅' ? styles.eTombstone : styles.eVal}>{value}</span>
                </div>
              ))
            }
          </div>
          {memTable.length >= MEM_CAPACITY && (
            <div className={styles.flushHint}>full — next write triggers flush ↓</div>
          )}
        </div>

        {/* flush arrow */}
        <div className={styles.flushArrow}>↓ flush to disk when full</div>

        {/* disk label */}
        <div className={styles.diskLabel}>DISK</div>

        {/* SSTables */}
        {sstables.length === 0 && (
          <div className={styles.noSSTables}>No SSTables yet</div>
        )}
        {sstables.map((ss, i) => {
          const status = sstableStatus(i)
          const isNewest = i === 0
          const flushed = ss.id === lastFlushed
          return (
            <div key={ss.id} className={`${styles.layer} ${styles.ssLayer}
              ${status === 'found' ? styles.layerFound : ''}
              ${status === 'checked' ? styles.layerChecked : ''}
              ${flushed ? styles.layerFlushed : ''}
            `}>
              <div className={styles.layerHeader}>
                <span className={styles.layerLabel}>SSTable-{sstables.length - i}</span>
                <span className={styles.layerMeta}>
                  {isNewest ? 'newest' : i === sstables.length - 1 ? 'oldest' : `${sstables.length - i - 1} newer above`}
                  {' · '}{ss.entries.length} keys
                </span>
              </div>
              <div className={styles.entries}>
                {ss.entries.map(({ key, value }) => {
                  const stale = isStale(key, i, memTable, sstables)
                  const hit = readResult?.foundIn === i && readResult.key === key
                  return (
                    <div key={key} className={`${styles.entry} ${stale ? styles.entryStale : ''} ${hit ? styles.entryHit : ''}`}>
                      <span className={styles.eKey}>{key}</span>
                      <span className={styles.eArrow}>→</span>
                      <span className={value === '∅' ? styles.eTombstone : styles.eVal}>{value}</span>
                      {stale && <span className={styles.staleTag}>stale</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
