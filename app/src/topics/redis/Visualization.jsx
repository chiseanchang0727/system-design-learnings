import { useState, useEffect } from 'react'
import styles from './Visualization.module.css'

const TYPES = [
  { id: 'string', label: 'String', cmd: 'SET / GET / INCR', desc: 'The simplest type — a key maps to a plain value. Numbers stored as strings support atomic INCR, making them perfect for counters and flags.', color: '#6366f1' },
  { id: 'hash',   label: 'Hash',   cmd: 'HSET / HGET',     desc: 'A map of field → value under one key. Think of it as a row in a table. Ideal for user profiles, session data, or any object you want to update field by field.', color: '#8b5cf6' },
  { id: 'list',   label: 'List',   cmd: 'LPUSH / RPUSH',   desc: 'An ordered sequence of strings. You can push to the head (LPUSH) or tail (RPUSH) and pop from either end — making it a natural queue, stack, or activity feed.', color: '#06b6d4' },
  { id: 'set',    label: 'Set',    cmd: 'SADD / SMEMBERS', desc: 'An unordered collection of unique strings. Duplicate adds are silently ignored. Great for tracking unique visitors, tags, or membership checks in O(1).', color: '#10b981' },
  { id: 'zset',   label: 'Sorted Set', cmd: 'ZADD / ZRANGE', desc: 'Like a set, but every member has a floating-point score. Members are automatically kept in score order. The canonical Redis use-case: leaderboards.', color: '#f59e0b' },
]

export default function RedisViz() {
  const [activeType, setActiveType] = useState('string')
  const [log, setLog] = useState([])

  // String
  const [stringStore, setStringStore] = useState({ 'user:1:name': 'Alice', 'page:views': '42' })
  const [strKey, setStrKey] = useState('')
  const [strVal, setStrVal] = useState('')
  const [strGetKey, setStrGetKey] = useState('')
  const [strIncrKey, setStrIncrKey] = useState('')

  // Hash
  const [hashStore, setHashStore] = useState({ 'user:1': { name: 'Alice', age: '30', city: 'NYC' } })
  const [hKey, setHKey] = useState('')
  const [hField, setHField] = useState('')
  const [hVal, setHVal] = useState('')
  const [hGetKey, setHGetKey] = useState('')
  const [hGetField, setHGetField] = useState('')
  const [hAllKey, setHAllKey] = useState('')

  // List
  const [listStore, setListStore] = useState({ 'queue:emails': ['send_welcome', 'send_promo'] })
  const [lKey, setLKey] = useState('')
  const [lVal, setLVal] = useState('')
  const [lRangeKey, setLRangeKey] = useState('')
  const [lPopKey, setLPopKey] = useState('')

  // Set
  const [setStore, setSetStore] = useState({ 'online:users': new Set(['alice', 'bob', 'charlie']) })
  const [sKey, setSKey] = useState('')
  const [sMember, setSMember] = useState('')
  const [sCheckKey, setSCheckKey] = useState('')
  const [sCheckMember, setSCheckMember] = useState('')

  // Sorted Set
  const [zsetStore, setZsetStore] = useState({
    'leaderboard': [
      { member: 'alice', score: 1500 },
      { member: 'bob', score: 1200 },
      { member: 'charlie', score: 900 },
    ],
  })
  const [zKey, setZKey] = useState('')
  const [zScore, setZScore] = useState('')
  const [zMember, setZMember] = useState('')
  const [zRangeKey, setZRangeKey] = useState('')
  const [zRankKey, setZRankKey] = useState('')
  const [zRankMember, setZRankMember] = useState('')

  // Diagram
  const [dStep, setDStep] = useState(0)
  const [dMode, setDMode] = useState(null)
  const [dRunning, setDRunning] = useState(false)

  const STEP_DESC = {
    hit: [
      '',
      'Frontend sends a request to the Backend',
      'Backend checks Redis for a cached value',
      'Cache HIT — the key exists in Redis',
      'Redis returns the cached value to Backend',
      'Backend returns the response to Frontend (no DB needed!)',
    ],
    miss: [
      '',
      'Frontend sends a request to the Backend',
      'Backend checks Redis for a cached value',
      'Cache MISS — key not found in Redis',
      'Backend queries the Database',
      'Database returns the result to Backend',
      'Backend stores the result in Redis for next time',
      'Backend returns the response to Frontend',
    ],
  }

  const runDiagram = async (mode) => {
    if (dRunning) return
    setDRunning(true)
    setDMode(mode)
    const total = mode === 'hit' ? 5 : 7
    for (let i = 1; i <= total; i++) {
      setDStep(i)
      await new Promise(r => setTimeout(r, 900))
    }
    await new Promise(r => setTimeout(r, 600))
    setDStep(0)
    setDMode(null)
    setDRunning(false)
  }

  const isActive = (arrow) => {
    if (!dMode) return false
    const map = {
      hit:  { fb_req: [1], br_req: [2], rb_res: [4], bf_res: [5] },
      miss: { fb_req: [1], br_req: [2], bd_req: [4], db_res: [5], br_store: [6], bf_res: [7] },
    }
    return map[dMode]?.[arrow]?.includes(dStep) ?? false
  }

  const boxBorder = (box) => {
    if (box === 'redis') {
      if (dMode === 'hit' && dStep === 3) return '#10b981'
      if (dMode === 'miss' && dStep === 3) return '#ef4444'
      if (dMode === 'miss' && dStep === 6) return '#6366f1'
    }
    if (box === 'database' && dMode === 'miss' && (dStep === 4 || dStep === 5)) return '#6366f1'
    if (box === 'backend' && dMode && dStep > 0) return '#6366f1'
    if (box === 'frontend' && dMode && (dStep === 1 || (dMode === 'hit' && dStep === 5) || (dMode === 'miss' && dStep === 7))) return '#6366f1'
    return null
  }

  // TTL
  const [ttlStore, setTtlStore] = useState({})
  const [ttlKey, setTtlKey] = useState('')
  const [ttlVal, setTtlVal] = useState('')
  const [ttlSecs, setTtlSecs] = useState('')
  const [tick, setTick] = useState(0)

  const addLog = msg => setLog(prev => [msg, ...prev].slice(0, 15))

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const now = Date.now()
    setTtlStore(prev => {
      const next = { ...prev }
      let changed = false
      Object.entries(next).forEach(([k, v]) => {
        if (v.expiresAt <= now) { delete next[k]; changed = true }
      })
      return changed ? next : prev
    })
  }, [tick])

  // String handlers
  const handleStrSet = () => {
    const k = strKey.trim(); const v = strVal.trim()
    if (!k || !v) return
    setStringStore(prev => ({ ...prev, [k]: v }))
    addLog(`SET "${k}" "${v}"  →  OK`)
    setStrKey(''); setStrVal('')
  }
  const handleStrGet = () => {
    const k = strGetKey.trim()
    if (!k) return
    const val = stringStore[k]
    addLog(val !== undefined ? `GET "${k}"  →  "${val}"` : `GET "${k}"  →  (nil)`)
    setStrGetKey('')
  }
  const handleStrIncr = () => {
    const k = strIncrKey.trim()
    if (!k) return
    const cur = parseInt(stringStore[k] ?? '0')
    if (isNaN(cur)) { addLog(`INCR "${k}"  →  ERR value is not an integer`); return }
    const next = cur + 1
    setStringStore(prev => ({ ...prev, [k]: String(next) }))
    addLog(`INCR "${k}"  →  ${next}`)
    setStrIncrKey('')
  }

  // Hash handlers
  const handleHSet = () => {
    const k = hKey.trim(); const f = hField.trim(); const v = hVal.trim()
    if (!k || !f || !v) return
    setHashStore(prev => ({ ...prev, [k]: { ...(prev[k] || {}), [f]: v } }))
    addLog(`HSET "${k}" "${f}" "${v}"  →  OK`)
    setHField(''); setHVal('')
  }
  const handleHGet = () => {
    const k = hGetKey.trim(); const f = hGetField.trim()
    if (!k || !f) return
    const val = hashStore[k]?.[f]
    addLog(val !== undefined ? `HGET "${k}" "${f}"  →  "${val}"` : `HGET "${k}" "${f}"  →  (nil)`)
    setHGetKey(''); setHGetField('')
  }
  const handleHGetAll = () => {
    const k = hAllKey.trim()
    if (!k) return
    const hash = hashStore[k]
    if (!hash) { addLog(`HGETALL "${k}"  →  (empty)`); return }
    const pairs = Object.entries(hash).map(([f, v]) => `${f}: "${v}"`).join(', ')
    addLog(`HGETALL "${k}"  →  { ${pairs} }`)
    setHAllKey('')
  }

  // List handlers
  const handleLPush = () => {
    const k = lKey.trim(); const v = lVal.trim()
    if (!k || !v) return
    setListStore(prev => ({ ...prev, [k]: [v, ...(prev[k] || [])] }))
    addLog(`LPUSH "${k}" "${v}"  →  ${(listStore[k]?.length ?? 0) + 1}`)
    setLVal('')
  }
  const handleRPush = () => {
    const k = lKey.trim(); const v = lVal.trim()
    if (!k || !v) return
    setListStore(prev => ({ ...prev, [k]: [...(prev[k] || []), v] }))
    addLog(`RPUSH "${k}" "${v}"  →  ${(listStore[k]?.length ?? 0) + 1}`)
    setLVal('')
  }
  const handleLRange = () => {
    const k = lRangeKey.trim()
    if (!k) return
    const list = listStore[k] ?? []
    addLog(`LRANGE "${k}" 0 -1  →  [${list.join(', ')}]`)
    setLRangeKey('')
  }
  const handleLPop = () => {
    const k = lPopKey.trim()
    if (!k) return
    const list = listStore[k] ?? []
    if (!list.length) { addLog(`LPOP "${k}"  →  (nil)`); return }
    const [popped, ...rest] = list
    setListStore(prev => ({ ...prev, [k]: rest }))
    addLog(`LPOP "${k}"  →  "${popped}"`)
    setLPopKey('')
  }

  // Set handlers
  const handleSAdd = () => {
    const k = sKey.trim(); const m = sMember.trim()
    if (!k || !m) return
    const wasPresent = setStore[k]?.has(m) ?? false
    setSetStore(prev => {
      const s = new Set(prev[k] ?? [])
      s.add(m)
      return { ...prev, [k]: s }
    })
    addLog(`SADD "${k}" "${m}"  →  ${wasPresent ? 0 : 1}`)
    setSMember('')
  }
  const handleSMembers = () => {
    const k = sKey.trim()
    if (!k) return
    const members = [...(setStore[k] ?? [])]
    addLog(`SMEMBERS "${k}"  →  (${members.length}) [${members.join(', ')}]`)
  }
  const handleSIsMember = () => {
    const k = sCheckKey.trim(); const m = sCheckMember.trim()
    if (!k || !m) return
    const is = setStore[k]?.has(m) ? 1 : 0
    addLog(`SISMEMBER "${k}" "${m}"  →  ${is}`)
    setSCheckKey(''); setSCheckMember('')
  }

  // Sorted Set handlers
  const handleZAdd = () => {
    const k = zKey.trim(); const score = parseFloat(zScore); const m = zMember.trim()
    if (!k || isNaN(score) || !m) return
    setZsetStore(prev => {
      const arr = [...(prev[k] ?? [])]
      const idx = arr.findIndex(e => e.member === m)
      if (idx >= 0) arr[idx] = { member: m, score }
      else arr.push({ member: m, score })
      arr.sort((a, b) => a.score - b.score)
      return { ...prev, [k]: arr }
    })
    addLog(`ZADD "${k}" ${score} "${m}"  →  OK`)
    setZScore(''); setZMember('')
  }
  const handleZRange = () => {
    const k = zRangeKey.trim()
    if (!k) return
    const arr = zsetStore[k] ?? []
    addLog(`ZRANGE "${k}" 0 -1 WITHSCORES  →  [${arr.map(e => `${e.member}(${e.score})`).join(', ')}]`)
    setZRangeKey('')
  }
  const handleZRank = () => {
    const k = zRankKey.trim(); const m = zRankMember.trim()
    if (!k || !m) return
    const arr = zsetStore[k] ?? []
    const rank = arr.findIndex(e => e.member === m)
    addLog(`ZRANK "${k}" "${m}"  →  ${rank === -1 ? '(nil)' : rank}`)
    setZRankMember('')
  }

  // TTL handler
  const handleSetEx = () => {
    const k = ttlKey.trim(); const v = ttlVal.trim(); const secs = parseInt(ttlSecs)
    if (!k || !v || isNaN(secs) || secs <= 0) return
    setTtlStore(prev => ({ ...prev, [k]: { value: v, expiresAt: Date.now() + secs * 1000, totalSecs: secs } }))
    addLog(`SETEX "${k}" ${secs} "${v}"  →  OK`)
    setTtlKey(''); setTtlVal(''); setTtlSecs('')
  }

  const typeInfo = TYPES.find(t => t.id === activeType)

  const storeItems = activeType === 'string' ? Object.entries(stringStore)
    : activeType === 'hash' ? Object.entries(hashStore)
    : activeType === 'list' ? Object.entries(listStore)
    : activeType === 'set' ? Object.entries(setStore).map(([k, s]) => [k, [...s]])
    : Object.entries(zsetStore)

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>System Architecture</h2>
        <p className={styles.sectionDesc}>
          Redis sits between your Backend and Database. On a cache hit the Database is never touched — that's what makes it fast.
        </p>
        <div className={styles.diagramWrap}>
          <svg viewBox="0 0 580 240" className={styles.diagram}>
            <defs>
              <marker id="arr-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#4a4a6a" />
              </marker>
              <marker id="arr-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#6366f1" />
              </marker>
            </defs>

            {/* Frontend */}
            <rect x="15" y="78" width="110" height="52" rx="8" fill="var(--surface)" stroke={boxBorder('frontend') || 'var(--border)'} strokeWidth={boxBorder('frontend') ? 2 : 1} />
            <text x="70" y="101" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">Frontend</text>
            <text x="70" y="118" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Browser</text>

            {/* Backend */}
            <rect x="235" y="78" width="110" height="52" rx="8" fill="var(--surface)" stroke={boxBorder('backend') || 'var(--border)'} strokeWidth={boxBorder('backend') ? 2 : 1} />
            <text x="290" y="101" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">Backend</text>
            <text x="290" y="118" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Python API</text>

            {/* Redis */}
            <rect x="455" y="78" width="110" height="52" rx="8" fill="var(--surface)" stroke={boxBorder('redis') || 'var(--border)'} strokeWidth={boxBorder('redis') ? 2 : 1} />
            <text x="510" y="101" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">Redis</text>
            <text x="510" y="118" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Cache (RAM)</text>
            {dMode === 'hit' && dStep === 3 && <text x="510" y="148" textAnchor="middle" fontSize="12" fontWeight="700" fill="#10b981">HIT ✓</text>}
            {dMode === 'miss' && dStep === 3 && <text x="510" y="148" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ef4444">MISS ✗</text>}

            {/* Database */}
            <rect x="235" y="175" width="110" height="52" rx="8" fill="var(--surface)" stroke={boxBorder('database') || 'var(--border)'} strokeWidth={boxBorder('database') ? 2 : 1} />
            <text x="290" y="198" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text)">Database</text>
            <text x="290" y="215" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Postgres / MySQL</text>

            {/* Frontend → Backend request */}
            <line x1="125" y1="93" x2="233" y2="93" stroke={isActive('fb_req') ? '#6366f1' : '#4a4a6a'} strokeWidth={isActive('fb_req') ? 2 : 1} markerEnd={isActive('fb_req') ? 'url(#arr-active)' : 'url(#arr-dim)'} />
            <text x="179" y="88" textAnchor="middle" fontSize="9" fill={isActive('fb_req') ? '#6366f1' : '#666'}>request</text>

            {/* Backend → Frontend response */}
            <line x1="235" y1="115" x2="127" y2="115" stroke={isActive('bf_res') ? '#6366f1' : '#4a4a6a'} strokeWidth={isActive('bf_res') ? 2 : 1} markerEnd={isActive('bf_res') ? 'url(#arr-active)' : 'url(#arr-dim)'} />
            <text x="181" y="128" textAnchor="middle" fontSize="9" fill={isActive('bf_res') ? '#6366f1' : '#666'}>response</text>

            {/* Backend → Redis check / store */}
            <line x1="345" y1="93" x2="453" y2="93" stroke={(isActive('br_req') || isActive('br_store')) ? '#6366f1' : '#4a4a6a'} strokeWidth={(isActive('br_req') || isActive('br_store')) ? 2 : 1} markerEnd={(isActive('br_req') || isActive('br_store')) ? 'url(#arr-active)' : 'url(#arr-dim)'} />
            <text x="399" y="88" textAnchor="middle" fontSize="9" fill={(isActive('br_req') || isActive('br_store')) ? '#6366f1' : '#666'}>{isActive('br_store') ? 'store' : 'check'}</text>

            {/* Redis → Backend cached value */}
            <line x1="455" y1="115" x2="347" y2="115" stroke={isActive('rb_res') ? '#6366f1' : '#4a4a6a'} strokeWidth={isActive('rb_res') ? 2 : 1} markerEnd={isActive('rb_res') ? 'url(#arr-active)' : 'url(#arr-dim)'} />
            <text x="401" y="128" textAnchor="middle" fontSize="9" fill={isActive('rb_res') ? '#6366f1' : '#666'}>cached value</text>

            {/* Backend → Database query */}
            <line x1="305" y1="130" x2="305" y2="173" stroke={isActive('bd_req') ? '#6366f1' : '#4a4a6a'} strokeWidth={isActive('bd_req') ? 2 : 1} markerEnd={isActive('bd_req') ? 'url(#arr-active)' : 'url(#arr-dim)'} />
            <text x="320" y="156" textAnchor="start" fontSize="9" fill={isActive('bd_req') ? '#6366f1' : '#666'}>query</text>

            {/* Database → Backend result */}
            <line x1="272" y1="175" x2="272" y2="132" stroke={isActive('db_res') ? '#6366f1' : '#4a4a6a'} strokeWidth={isActive('db_res') ? 2 : 1} markerEnd={isActive('db_res') ? 'url(#arr-active)' : 'url(#arr-dim)'} />
            <text x="257" y="156" textAnchor="end" fontSize="9" fill={isActive('db_res') ? '#6366f1' : '#666'}>result</text>
          </svg>

          <div className={styles.diagramStep}>
            {dStep === 0 ? 'Pick a scenario below to animate the request flow' : STEP_DESC[dMode]?.[dStep]}
          </div>

          <div className={styles.diagramBtns}>
            <button className={`${styles.btn} ${styles.btnGreen}`} onClick={() => runDiagram('hit')} disabled={dRunning}>
              Simulate Cache Hit
            </button>
            <button className={`${styles.btn} ${styles.btnRed}`} onClick={() => runDiagram('miss')} disabled={dRunning}>
              Simulate Cache Miss
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Redis Data Types — Interactive Demo</h2>
        <p className={styles.sectionDesc}>
          Every Redis key holds exactly one data type. Pick a type below, run commands, and watch the store update in real time.
        </p>
      </section>

      <div className={styles.tabs}>
        {TYPES.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeType === t.id ? styles.tabActive : ''}`}
            style={activeType === t.id ? { borderColor: t.color, color: t.color } : {}}
            onClick={() => setActiveType(t.id)}
          >
            <span>{t.label}</span>
            <span className={styles.tabCmd}>{t.cmd}</span>
          </button>
        ))}
      </div>

      <div className={styles.typeDesc} style={{ borderLeftColor: typeInfo.color }}>
        {typeInfo.desc}
      </div>

      <div className={styles.layout}>
        {/* Store viewer */}
        <div className={styles.storePanel}>
          <div className={styles.storeHeader}>
            <span>Store ({storeItems.length} key{storeItems.length !== 1 ? 's' : ''})</span>
            <span className={styles.typeTag} style={{ background: typeInfo.color + '22', color: typeInfo.color }}>{typeInfo.label}</span>
          </div>
          <div className={styles.storeSlots}>
            {storeItems.length === 0 && <div className={styles.empty}>No keys — run a command</div>}

            {activeType === 'string' && storeItems.map(([k, v]) => (
              <div key={k} className={styles.slot}>
                <span className={styles.slotKey}>{k}</span>
                <span className={styles.slotArrow}>→</span>
                <span className={styles.slotVal}>{v}</span>
              </div>
            ))}

            {activeType === 'hash' && storeItems.map(([k, hash]) => (
              <div key={k} className={styles.slotGroup}>
                <div className={styles.slotGroupKey}>{k}</div>
                {Object.entries(hash).map(([f, v]) => (
                  <div key={f} className={styles.slotField}>
                    <span className={styles.fieldName}>{f}</span>
                    <span className={styles.slotArrow}>→</span>
                    <span className={styles.slotVal}>{v}</span>
                  </div>
                ))}
              </div>
            ))}

            {activeType === 'list' && storeItems.map(([k, arr]) => (
              <div key={k} className={styles.slotGroup}>
                <div className={styles.slotGroupKey}>{k} <span className={styles.dim}>len={arr.length}</span></div>
                {arr.map((v, i) => (
                  <div key={i} className={styles.slotField}>
                    <span className={styles.slotRank}>[{i}]</span>
                    <span className={styles.slotVal}>{v}</span>
                  </div>
                ))}
                {arr.length === 0 && <div className={styles.dim} style={{ padding: '6px 14px', fontSize: 12 }}>(empty list)</div>}
              </div>
            ))}

            {activeType === 'set' && storeItems.map(([k, members]) => (
              <div key={k} className={styles.slotGroup}>
                <div className={styles.slotGroupKey}>{k} <span className={styles.dim}>({members.length} members)</span></div>
                <div className={styles.setMembers}>
                  {members.map(m => <span key={m} className={styles.setMember}>{m}</span>)}
                </div>
              </div>
            ))}

            {activeType === 'zset' && storeItems.map(([k, arr]) => (
              <div key={k} className={styles.slotGroup}>
                <div className={styles.slotGroupKey}>{k}</div>
                {arr.map((e, i) => (
                  <div key={e.member} className={styles.slotField}>
                    <span className={styles.slotRank}>#{i + 1}</span>
                    <span className={styles.slotKey}>{e.member}</span>
                    <span className={styles.scoreChip}>{e.score}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Commands */}
        <div className={styles.controls}>
          {activeType === 'string' && <>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>SET key value</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={strKey} onChange={e => setStrKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStrSet()} />
                <input className={styles.input} placeholder="value" value={strVal} onChange={e => setStrVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStrSet()} />
                <button className={styles.btn} onClick={handleStrSet}>SET</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>GET key</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={strGetKey} onChange={e => setStrGetKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStrGet()} />
                <button className={styles.btn} onClick={handleStrGet}>GET</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>INCR key <span className={styles.cmdNote}>atomic +1 (for counters)</span></h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={strIncrKey} onChange={e => setStrIncrKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleStrIncr()} />
                <button className={styles.btn} onClick={handleStrIncr}>INCR</button>
              </div>
            </div>
          </>}

          {activeType === 'hash' && <>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>HSET key field value</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={hKey} onChange={e => setHKey(e.target.value)} />
                <input className={styles.input} placeholder="field" value={hField} onChange={e => setHField(e.target.value)} />
                <input className={styles.input} placeholder="value" value={hVal} onChange={e => setHVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleHSet()} />
                <button className={styles.btn} onClick={handleHSet}>HSET</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>HGET key field</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={hGetKey} onChange={e => setHGetKey(e.target.value)} />
                <input className={styles.input} placeholder="field" value={hGetField} onChange={e => setHGetField(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleHGet()} />
                <button className={styles.btn} onClick={handleHGet}>HGET</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>HGETALL key</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={hAllKey} onChange={e => setHAllKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleHGetAll()} />
                <button className={styles.btn} onClick={handleHGetAll}>HGETALL</button>
              </div>
            </div>
          </>}

          {activeType === 'list' && <>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>LPUSH / RPUSH key value</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={lKey} onChange={e => setLKey(e.target.value)} />
                <input className={styles.input} placeholder="value" value={lVal} onChange={e => setLVal(e.target.value)} />
                <button className={styles.btn} onClick={handleLPush}>LPUSH</button>
                <button className={styles.btn} onClick={handleRPush}>RPUSH</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>LRANGE key 0 -1</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={lRangeKey} onChange={e => setLRangeKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLRange()} />
                <button className={styles.btn} onClick={handleLRange}>LRANGE</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>LPOP key <span className={styles.cmdNote}>dequeue from head</span></h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={lPopKey} onChange={e => setLPopKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLPop()} />
                <button className={styles.btn} onClick={handleLPop}>LPOP</button>
              </div>
            </div>
          </>}

          {activeType === 'set' && <>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>SADD key member</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={sKey} onChange={e => setSKey(e.target.value)} />
                <input className={styles.input} placeholder="member" value={sMember} onChange={e => setSMember(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSAdd()} />
                <button className={styles.btn} onClick={handleSAdd}>SADD</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>SMEMBERS key</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={sKey} onChange={e => setSKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSMembers()} />
                <button className={styles.btn} onClick={handleSMembers}>SMEMBERS</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>SISMEMBER key member</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={sCheckKey} onChange={e => setSCheckKey(e.target.value)} />
                <input className={styles.input} placeholder="member" value={sCheckMember} onChange={e => setSCheckMember(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSIsMember()} />
                <button className={styles.btn} onClick={handleSIsMember}>SISMEMBER</button>
              </div>
            </div>
          </>}

          {activeType === 'zset' && <>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>ZADD key score member</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={zKey} onChange={e => setZKey(e.target.value)} />
                <input className={styles.input} placeholder="score" value={zScore} onChange={e => setZScore(e.target.value)} style={{ maxWidth: 80 }} />
                <input className={styles.input} placeholder="member" value={zMember} onChange={e => setZMember(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleZAdd()} />
                <button className={styles.btn} onClick={handleZAdd}>ZADD</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>ZRANGE key 0 -1 WITHSCORES</h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={zRangeKey} onChange={e => setZRangeKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleZRange()} />
                <button className={styles.btn} onClick={handleZRange}>ZRANGE</button>
              </div>
            </div>
            <div className={styles.controlCard}>
              <h3 className={styles.controlTitle}>ZRANK key member <span className={styles.cmdNote}>0-indexed rank</span></h3>
              <div className={styles.inputRow}>
                <input className={styles.input} placeholder="key" value={zRankKey} onChange={e => setZRankKey(e.target.value)} />
                <input className={styles.input} placeholder="member" value={zRankMember} onChange={e => setZRankMember(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleZRank()} />
                <button className={styles.btn} onClick={handleZRank}>ZRANK</button>
              </div>
            </div>
          </>}

          <div className={styles.logCard}>
            <h3 className={styles.controlTitle}>Result Log</h3>
            {log.length === 0 && <p className={styles.logEmpty}>Run a command to see results</p>}
            {log.map((entry, i) => (
              <div key={i} className={`${styles.logEntry} ${i === 0 ? styles.logNew : ''}`}>{entry}</div>
            ))}
          </div>
        </div>
      </div>

      {/* TTL Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>TTL / Key Expiration</h2>
        <p className={styles.sectionDesc}>
          Any Redis key can have a TTL (time-to-live). Once it hits zero, Redis automatically deletes the key — no cron job needed.
          This is the mechanism behind every cache invalidation strategy.
        </p>
        <div className={styles.ttlDemo}>
          <div className={styles.controlCard}>
            <h3 className={styles.controlTitle}>SETEX key seconds value</h3>
            <div className={styles.inputRow}>
              <input className={styles.input} placeholder="key" value={ttlKey} onChange={e => setTtlKey(e.target.value)} />
              <input className={styles.input} placeholder="seconds" value={ttlSecs} onChange={e => setTtlSecs(e.target.value)} style={{ maxWidth: 100 }} />
              <input className={styles.input} placeholder="value" value={ttlVal} onChange={e => setTtlVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSetEx()} />
              <button className={styles.btn} onClick={handleSetEx}>SETEX</button>
            </div>
          </div>
          <div className={styles.ttlKeys}>
            {Object.keys(ttlStore).length === 0 && (
              <div className={styles.empty} style={{ padding: '20px 0' }}>No expiring keys — try SETEX above (e.g. key=token, seconds=30)</div>
            )}
            {Object.entries(ttlStore).map(([k, { value, expiresAt, totalSecs }]) => {
              const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
              const pct = remaining / totalSecs
              const barColor = pct > 0.5 ? '#10b981' : pct > 0.2 ? '#f59e0b' : '#ef4444'
              return (
                <div key={k} className={styles.ttlKey}>
                  <div className={styles.ttlKeyTop}>
                    <span className={styles.slotKey}>{k}</span>
                    <span className={styles.slotArrow}>→</span>
                    <span className={styles.slotVal}>{value}</span>
                    <span className={styles.ttlBadge} style={{ color: barColor }}>TTL: {remaining}s</span>
                  </div>
                  <div className={styles.ttlBar}>
                    <div className={styles.ttlBarInner} style={{ width: `${pct * 100}%`, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Python reference */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Python Reference</h2>
        <p className={styles.sectionDesc}>
          Install with <code>pip install redis</code>. Every command maps 1:1 to a Python method on the client.
        </p>
        <pre className={styles.code}>{`import redis

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# --- String ---
r.set('user:1:name', 'Alice')
r.get('user:1:name')                        # 'Alice'
r.incr('page:views')                        # atomic +1
r.setex('session:abc', 30, 'token_xyz')     # expires in 30s

# --- Hash ---
r.hset('user:1', mapping={'name': 'Alice', 'age': '30', 'city': 'NYC'})
r.hget('user:1', 'name')                    # 'Alice'
r.hgetall('user:1')                         # {'name': 'Alice', ...}

# --- List ---
r.lpush('queue:emails', 'send_welcome')
r.rpush('queue:emails', 'send_promo')
r.lrange('queue:emails', 0, -1)             # ['send_welcome', 'send_promo']
r.lpop('queue:emails')                      # 'send_welcome'

# --- Set ---
r.sadd('online:users', 'alice', 'bob', 'charlie')
r.smembers('online:users')                  # {'alice', 'bob', 'charlie'}
r.sismember('online:users', 'alice')        # True

# --- Sorted Set ---
r.zadd('leaderboard', {'alice': 1500, 'bob': 1200, 'charlie': 900})
r.zrange('leaderboard', 0, -1, withscores=True)  # [('charlie', 900.0), ...]
r.zrank('leaderboard', 'alice')             # 2 (0-indexed, lowest score first)

# --- TTL ---
r.ttl('session:abc')                        # remaining seconds, -1 = no expiry
r.expire('user:1:name', 3600)               # set TTL on existing key`}</pre>
      </section>

      {/* Use Cases */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Common Use Cases</h2>
        <div className={styles.conceptGrid}>
          <div className={styles.conceptCard}>
            <h3>Cache (String + TTL)</h3>
            <p>SET user:42 "{'{...}'}" EX 3600. Serve from Redis on every request; refresh when TTL expires. Reduces DB load dramatically.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Session Store (Hash)</h3>
            <p>HSET session:abc user_id 42 role admin. Each field is one session attribute. Expire the whole key on logout.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Rate Limiter (String + INCR)</h3>
            <p>INCR rate:user:42 is atomic — no race conditions. EXPIRE on first write. Reject when count exceeds your limit.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Leaderboard (Sorted Set)</h3>
            <p>ZADD scores 1500 alice. ZRANGE gives real-time ranking. Scores update in O(log N) — millions of players, no problem.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Job Queue (List)</h3>
            <p>Producer: LPUSH queue:jobs task. Consumer: BRPOP queue:jobs 0 (blocking pop). Simple, persistent, no broker needed.</p>
          </div>
          <div className={styles.conceptCard}>
            <h3>Unique Visitors (Set)</h3>
            <p>SADD visitors:2024-06-24 user:99. SCARD gives exact count. Duplicates ignored automatically. O(1) membership check.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
