import { Link } from 'react-router-dom'
import { topicGroups } from '../topics/index.js'
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

      {topicGroups.map(group => (
        <div key={group.title} className={styles.group}>
          <h2 className={styles.groupTitle}>{group.title}</h2>
          <div className={styles.grid}>
            {group.topics.map(topic => (
              <Link
                key={topic.slug}
                to={topic.subtopics ? `/topics/${topic.slug}/${topic.subtopics[0].slug}` : `/topics/${topic.slug}`}
                className={styles.card}
              >
                <span className={styles.cardIcon}>{topic.icon}</span>
                <h3 className={styles.cardTitle}>{topic.title}</h3>
                <p className={styles.cardDesc}>{topic.description}</p>
                {topic.subtopics && (
                  <div className={styles.subLinks}>
                    {topic.subtopics.map(s => <span key={s.slug} className={styles.subLink}>{s.title}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
