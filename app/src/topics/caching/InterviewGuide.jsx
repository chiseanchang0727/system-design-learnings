import styles from './InterviewGuide.module.css'

const STEPS = [
  {
    num: 1,
    title: 'State the bottleneck',
    body: 'Which read path is slow? How high is QPS? Where is the database under pressure? Ground the discussion in a concrete problem before proposing a solution.',
    tags: ['read path', 'QPS', 'DB pressure'],
  },
  {
    num: 2,
    title: 'Decide what to cache',
    body: 'Only cache data that is read-heavy, rarely changes, can be reconstructed if lost, or tolerates brief staleness. Never cache data that must always be fresh (e.g. inventory, payment state).',
    tags: ['read-heavy', 'low churn', 'reconstructable', 'tolerable staleness'],
  },
  {
    num: 3,
    title: 'Choose the cache location',
    body: 'Pick the layer closest to the user that still makes sense for the data type.',
    tags: ['CDN', 'external cache (Redis)', 'in-process', 'client-side'],
  },
  {
    num: 4,
    title: 'Name the pattern',
    body: 'Cache-aside is the default: app checks cache first, falls back to DB on miss, backfills the cache. CDN behaves like read-through. Write-through and write-back are options when write latency matters.',
    tags: ['cache-aside', 'read-through', 'write-through', 'write-back'],
  },
  {
    num: 5,
    title: 'Address freshness',
    body: 'How does stale data get cleared? TTL is the baseline. Active invalidation (delete on write) is stronger. Event-driven purge reacts to upstream changes. Versioned keys sidestep invalidation entirely.',
    tags: ['TTL', 'invalidation', 'event-driven purge', 'versioned keys'],
  },
  {
    num: 6,
    title: 'Cover failure modes',
    body: 'Show you\'ve thought about what goes wrong: cache stampede (many misses hitting DB at once), hot key (one key overloads one shard), cache down (fall back gracefully to DB), stale data (acceptable window vs hard requirement).',
    tags: ['stampede', 'hot key', 'cache down', 'stale data'],
  },
  {
    num: 7,
    title: 'Mention observability',
    body: 'What metrics tell you the cache is healthy? Hit rate, miss rate, latency (cache vs DB), eviction rate, and hot key detection. A cache with no monitoring is a liability.',
    tags: ['hit rate', 'latency', 'eviction rate', 'hot key'],
  },
]

const EXAMPLE = {
  context: 'QR Code Generator',
  answer: [
    { text: 'In a QR Code Generator, I would cache ' },
    { text: 'token → destination_url', highlight: true },
    { text: ' because the redirect path is read-heavy and low-write, and hitting the database on every scan adds unnecessary latency.' },
    { text: '\n\nThe pattern is cache-aside: check Redis first, fall back to the database on a miss and backfill the cache. When a QR destination is updated, delete the cache key immediately and rely on TTL as a backstop to prevent permanently stale redirects.' },
    { text: '\n\nIf a large event causes a single QR code to become a hot key, I would add an in-process cache layer or use key fanout (replicate the value across multiple keys and load-balance reads across them).' },
  ],
}

export default function InterviewGuide() {
  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How to Talk About Caching in an Interview</h2>
        <p className={styles.sectionDesc}>
          Follow this 7-step framework to give a structured, complete answer. Each step signals a different level of depth — most candidates stop at step 2 or 3.
        </p>
      </section>

      <div className={styles.steps}>
        {STEPS.map(step => (
          <div key={step.num} className={styles.step}>
            <div className={styles.stepNum}>{step.num}</div>
            <div className={styles.stepBody}>
              <div className={styles.stepTitle}>{step.title}</div>
              <p className={styles.stepDesc}>{step.body}</p>
              <div className={styles.tags}>
                {step.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Example Answer</h2>
        <p className={styles.sectionDesc}>Context: <strong>{EXAMPLE.context}</strong></p>
        <blockquote className={styles.quote}>
          {EXAMPLE.answer.map((part, i) =>
            part.highlight
              ? <code key={i} className={styles.inline}>{part.text}</code>
              : <span key={i}>{part.text}</span>
          )}
        </blockquote>
      </section>
    </div>
  )
}
