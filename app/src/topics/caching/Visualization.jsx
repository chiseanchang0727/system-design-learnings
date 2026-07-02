import { useState, useCallback } from 'react'
import styles from './Visualization.module.css'

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    this.map = new Map()
  }

  get(key) {
    if (!this.map.has(key)) return -1
    const val = this.map.get(key)
    this.map.delete(key)
    this.map.set(key, val)
    return val
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    else if (this.map.size >= this.capacity) {
      this.map.delete(this.map.keys().next().value)
    }
    this.map.set(key, value)
  }

  snapshot() {
    return [...this.map.entries()].reverse()
  }
}

const CAPACITY = 5

export default function CachingViz() {
  const [cache] = useState(() => new LRUCache(CAPACITY))
  const [entries, setEntries] = useState([])
  const [log, setLog] = useState([])
  const [keyInput, setKeyInput] = useState('')
  const [valInput, setValInput] = useState('')
  const [getKey, setGetKey] = useState('')
  const [highlight, setHighlight] = useState(null)
  const [evicted, setEvicted] = useState(null)

  const refresh = useCallback((action, evictedKey) => {
    setEntries(cache.snapshot())
    setLog(prev => [action, ...prev].slice(0, 12))
    if (evictedKey !== undefined) {
      setEvicted(evictedKey)
      setTimeout(() => setEvicted(null), 1200)
    }
  }, [cache])

  const handlePut = () => {
    const k = keyInput.trim()
    const v = valInput.trim()
    if (!k || !v) return
    const wasPresent = cache.map.has(k)
    const wouldEvict = !wasPresent && cache.map.size >= CAPACITY
    const evictKey = wouldEvict ? cache.map.keys().next().value : undefined
    cache.put(k, v)
    setHighlight(k)
    setTimeout(() => setHighlight(null), 800)
    refresh(
      wouldEvict
        ? `PUT "${k}" = "${v}"  →  evicted "${evictKey}"`
        : `PUT "${k}" = "${v}"${wasPresent ? ' (updated)' : ''}`,
      evictKey
    )
    setKeyInput('')
    setValInput('')
  }

  const handleGet = () => {
    const k = getKey.trim()
    if (!k) return
    const result = cache.get(k)
    setHighlight(k)
    setTimeout(() => setHighlight(null), 800)
    refresh(result === -1 ? `GET "${k}"  →  MISS` : `GET "${k}"  →  "${result}" (hit)`)
    setGetKey('')
  }

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>LRU Cache — Least Recently Used</h2>
        <p className={styles.sectionDesc}>
          LRU is a cache eviction policy. When the cache is full and a new item arrives, it evicts the item that
          <strong> hasn't been accessed for the longest time</strong> — the assumption being: if you haven't used
          something recently, you probably don't need it soon.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How to use</h2>
        <div className={styles.conceptGrid}>
          <div className={styles.conceptCard}>
            <h3>PUT a value</h3>
            <p>Type a key and value, then click PUT. The entry appears at the top (MRU position). If the key already exists, its value is updated and it moves to the top.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>GET a value</h3>
            <p>Type a key and click GET. On a hit, the entry moves to the top — it's now the most recently used. On a miss, the log shows MISS and nothing changes.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Watch eviction</h3>
            <p>Fill the cache to capacity ({CAPACITY}), then PUT a new key. The bottom entry (LRU) is evicted automatically to make room — watch it flash red.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Read the order</h3>
            <p>The list is ordered MRU → LRU top to bottom. The top entry was accessed most recently. The bottom entry will be evicted next if the cache fills up.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Interactive Demo</h2>
        <p className={styles.sectionDesc}>
          Capacity: <strong>{CAPACITY}</strong>. Most-recently-used is at the top. When full, the least-recently-used entry is evicted.
        </p>
      </section>

      <div className={styles.layout}>
        <div className={styles.cachePanel}>
          <div className={styles.cacheHeader}>
            <span>Cache ({entries.length}/{CAPACITY})</span>
            <span className={styles.mruLabel}>← MRU</span>
          </div>
          <div className={styles.cacheSlots}>
            {entries.length === 0 && (
              <div className={styles.empty}>Cache is empty</div>
            )}
            {entries.map(([k, v], i) => (
              <div
                key={k}
                className={[
                  styles.slot,
                  highlight === k ? styles.slotHit : '',
                  evicted === k ? styles.slotEvict : '',
                  i === 0 ? styles.slotMRU : '',
                ].join(' ')}
              >
                <span className={styles.slotRank}>{entries.length - i}</span>
                <span className={styles.slotKey}>{k}</span>
                <span className={styles.slotArrow}>→</span>
                <span className={styles.slotVal}>{v}</span>
                {i === 0 && <span className={styles.badge}>MRU</span>}
                {i === entries.length - 1 && entries.length > 1 && (
                  <span className={`${styles.badge} ${styles.badgeLRU}`}>LRU</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.fillBar}>
            <div
              className={styles.fillBarInner}
              style={{ width: `${(entries.length / CAPACITY) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlCard}>
            <h3 className={styles.controlTitle}>PUT (write)</h3>
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                placeholder="key"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePut()}
              />
              <input
                className={styles.input}
                placeholder="value"
                value={valInput}
                onChange={e => setValInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePut()}
              />
              <button className={styles.btn} onClick={handlePut}>PUT</button>
            </div>
          </div>

          <div className={styles.controlCard}>
            <h3 className={styles.controlTitle}>GET (read)</h3>
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                placeholder="key"
                value={getKey}
                onChange={e => setGetKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGet()}
              />
              <button className={styles.btn} onClick={handleGet}>GET</button>
            </div>
          </div>

          <div className={styles.logCard}>
            <h3 className={styles.controlTitle}>Operation Log</h3>
            {log.length === 0 && <p className={styles.logEmpty}>No operations yet</p>}
            {log.map((entry, i) => (
              <div key={i} className={`${styles.logEntry} ${i === 0 ? styles.logNew : ''}`}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.conceptGrid}>
          <div className={styles.conceptCard}>
            <h3>O(1) get & put</h3>
            <p>A HashMap gives O(1) lookup. A doubly-linked list tracks recency. Combined: O(1) for both operations.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Eviction Policy</h3>
            <p>When capacity is hit, the Least Recently Used entry (tail of the list) is removed first.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Use Cases</h3>
            <p>CPU L1/L2 cache, DNS resolution, database query results, CDN edge nodes, session stores.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Alternatives</h3>
            <p>LFU evicts the least-frequently-used. FIFO evicts oldest insert. ARC adapts between LRU and LFU.</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Reference Implementation</h2>
        <p className={styles.sectionDesc}>See <code>topics/caching/code/lru_cache.py</code></p>
        <pre className={styles.code}>{`class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache: dict = {}         # key -> node
        # Sentinel head/tail — avoids edge-case checks
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._move_to_front(node)
        else:
            if len(self.cache) == self.cap:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            node = Node(key, value)
            self.cache[key] = node
            self._insert_front(node)

    def _remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert_front(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def _move_to_front(self, node):
        self._remove(node)
        self._insert_front(node)`}</pre>
      </section>
    </div>
  )
}
