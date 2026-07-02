import { useState } from 'react'
import styles from './CaseStudies.module.css'

const CASES = [
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
  const [open, setOpen] = useState('YouTube')

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
