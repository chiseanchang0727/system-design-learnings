import { useState } from 'react'
import styles from './CaseStudies.module.css'

const CASES = [
  {
    company: 'QR Code Generator',
    icon: '⬛',
    summary: 'QR redirect is a standard caching example — token lookup with Redis, DB fallback, and TTL-based invalidation.',
    readPath: 'token → Redis cache → database fallback → redirect',
    cacheKey: 'qr:token:evt_2026_checkin',
    valueFields: ['destination URL', 'status', 'owner id', 'version'],
    ttlNote: 'Minutes to hours — depends on how frequently the QR destination is updated.',
    insights: [
      {
        title: 'Update strategy: DB first, then invalidate cache',
        body: 'When a destination changes, update the database first, then delete or update the Redis key. This prevents the cache from serving a stale destination after the write.',
      },
      {
        title: 'Redirect path can tolerate brief misses — but not disabled codes',
        body: 'A cache miss on a valid QR just adds a small DB round-trip delay. But a disabled or expired QR code that keeps redirecting to the old URL is a real problem. Cache must have both TTL and active invalidation for status changes.',
      },
      {
        title: 'Hot key risk at large events',
        body: 'A single QR code at a large event (e.g. check-in) gets scanned thousands of times per second. That single Redis key becomes a hot key. Mitigate with an in-process cache layer or key sharding (replicate across multiple keys).',
      },
    ],
  },
  {
    company: 'Airbnb',
    icon: '🏠',
    summary: 'Listing detail and search results are good cache candidates, but the booking path must bypass cache entirely.',
    canCache: ['Listing metadata', 'Host profile', 'Search result page', 'Price calendar read model'],
    cannotCache: ['Final availability', 'Payment state', 'Booking confirmation'],
    insights: [
      {
        title: 'Search results can use a short TTL',
        body: 'Caching search results with a short TTL speeds up browsing significantly. Slightly stale prices or availability are acceptable at the search stage — users expect to browse before committing.',
      },
      {
        title: 'Booking path must hit the database',
        body: 'When a user actually presses Book, the system must go to a database transaction to check real inventory. A cache hit here could let two users book the same listing simultaneously. Cache cannot be the source of truth for availability, payment state, or confirmation.',
      },
    ],
  },
  {
    company: 'YouTube',
    icon: '▶',
    summary: 'Multi-layer caching across CDN, external cache, in-process cache, and client cache.',
    layers: [
      { name: 'CDN', color: '#6366f1', items: ['Video segments', 'Thumbnails', 'Static assets'] },
      { name: 'External Cache (Redis)', color: '#8b5cf6', items: ['Video metadata', 'Channel profile', 'Comment summary'] },
      { name: 'In-process Cache', color: '#06b6d4', items: ['Feature flags', 'Hot config'] },
      { name: 'Client Cache', color: '#10b981', items: ['Recently played info', 'Thumbnails', 'Partial metadata'] },
    ],
    insights: [
      { title: 'View count is eventually consistent', body: 'YouTube does write aggregation — each server accumulates counts locally and flushes periodically. The frontend shows an approximation. Nobody notices ±1,000 on a video with 10M views.' },
      { title: 'Some data cannot rely on TTL alone', body: 'Video availability, copyright blocks, and private/public status changes are legally sensitive. A cache that serves a taken-down video for 5 more minutes is a real problem. These require push-based fast invalidation, not just TTL expiry.' },
    ],
  },
]

export default function CaseStudies() {
  const [open, setOpen] = useState('QR Code Generator')

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Real-World Caching Case Studies</h2>
        <p className={styles.sectionDesc}>
          How production systems at scale apply caching — which layers they use, what trade-offs they accept, and where TTL alone is not enough.
        </p>
      </section>

      <div className={styles.cases}>
        {CASES.map(c => (
          <div key={c.company} className={styles.card}>
            <button className={styles.cardHeader} onClick={() => setOpen(open === c.company ? null : c.company)}>
              <span className={styles.cardIcon}>{c.icon}</span>
              <span className={styles.cardCompany}>{c.company}</span>
              <span className={styles.cardSummary}>{c.summary}</span>
              <span className={styles.chevron}>{open === c.company ? '▲' : '▼'}</span>
            </button>

            {open === c.company && (
              <div className={styles.cardBody}>

                {/* Read path */}
                {c.readPath && (
                  <>
                    <h3 className={styles.bodyTitle}>Read Path</h3>
                    <pre className={styles.codeBlock}>{c.readPath}</pre>
                  </>
                )}

                {/* Cache key */}
                {c.cacheKey && (
                  <>
                    <h3 className={styles.bodyTitle}>Cache Key</h3>
                    <pre className={styles.codeBlock}>{c.cacheKey}</pre>
                  </>
                )}

                {/* Value fields */}
                {c.valueFields && (
                  <>
                    <h3 className={styles.bodyTitle}>Value Fields</h3>
                    <div className={styles.layerItems}>
                      {c.valueFields.map(f => <span key={f} className={styles.chip}>{f}</span>)}
                    </div>
                  </>
                )}

                {/* TTL note */}
                {c.ttlNote && (
                  <>
                    <h3 className={styles.bodyTitle}>TTL</h3>
                    <p className={styles.sectionDesc}>{c.ttlNote}</p>
                  </>
                )}

                {/* Can / cannot cache (Airbnb style) */}
                {c.canCache && (
                  <>
                    <h3 className={styles.bodyTitle}>Can Cache</h3>
                    <div className={styles.layerItems}>
                      {c.canCache.map(f => <span key={f} className={`${styles.chip} ${styles.chipGreen}`}>{f}</span>)}
                    </div>
                  </>
                )}
                {c.cannotCache && (
                  <>
                    <h3 className={styles.bodyTitle}>Cannot Cache</h3>
                    <div className={styles.layerItems}>
                      {c.cannotCache.map(f => <span key={f} className={`${styles.chip} ${styles.chipRed}`}>{f}</span>)}
                    </div>
                  </>
                )}

                {/* Layers (YouTube style) */}
                {c.layers && (
                  <>
                    <h3 className={styles.bodyTitle}>Cache Layers</h3>
                    <div className={styles.layers}>
                      {c.layers.map((layer, i) => (
                        <div key={layer.name} className={styles.layer}>
                          <div className={styles.layerNum} style={{ background: layer.color }}>{i + 1}</div>
                          <div className={styles.layerContent}>
                            <div className={styles.layerName} style={{ color: layer.color }}>{layer.name}</div>
                            <div className={styles.layerItems}>
                              {layer.items.map(item => (
                                <span key={item} className={styles.chip}>{item}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Insights */}
                <h3 className={styles.bodyTitle} style={{ marginTop: 24 }}>Key Insights</h3>
                <div className={styles.insights}>
                  {c.insights.map(ins => (
                    <div key={ins.title} className={styles.insight}>
                      <div className={styles.insightTitle}>{ins.title}</div>
                      <p className={styles.insightBody}>{ins.body}</p>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        ))}

        <div className={styles.placeholder}>
          <span>More case studies coming soon...</span>
        </div>
      </div>
    </div>
  )
}
