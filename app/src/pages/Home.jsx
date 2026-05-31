import { Link } from 'react-router-dom'
import { topics } from '../topics/index.js'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>System Design Learnings</h1>
        <p className={styles.subtitle}>
          Interactive visualizations and reference implementations for core distributed systems concepts.
        </p>
      </div>
      <div className={styles.grid}>
        {topics.map(topic => (
          <Link key={topic.slug} to={`/topics/${topic.slug}`} className={styles.card}>
            <span className={styles.cardIcon}>{topic.icon}</span>
            <h2 className={styles.cardTitle}>{topic.title}</h2>
            <p className={styles.cardDesc}>{topic.description}</p>
          </Link>
        ))}
        <div className={styles.cardPlaceholder}>
          <span className={styles.cardIcon}>+</span>
          <p className={styles.cardDesc}>More topics coming soon</p>
        </div>
      </div>
    </div>
  )
}
