import { useParams, NavLink } from 'react-router-dom'
import { topicGroups } from '../topics/index.js'
import styles from './TopicPage.module.css'

export default function TopicPage() {
  const { slug, subslug } = useParams()

  const topic = topicGroups.flatMap(g => g.topics).find(t => t.slug === slug)
  if (!topic) return <div className={styles.notFound}>Topic not found.</div>

  if (topic.subtopics) {
    const activeSub = subslug
      ? topic.subtopics.find(s => s.slug === subslug)
      : topic.subtopics[0]

    if (!activeSub) return <div className={styles.notFound}>Sub-topic not found.</div>

    const Viz = activeSub.component

    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.icon}>{topic.icon}</span>
          <div>
            <h1 className={styles.title}>{topic.title}</h1>
            <p className={styles.desc}>{topic.description}</p>
          </div>
        </div>
        <nav className={styles.subNav}>
          {topic.subtopics.map(sub => (
            <NavLink
              key={sub.slug}
              to={`/topics/${slug}/${sub.slug}`}
              className={({ isActive }) =>
                `${styles.subNavLink} ${isActive || (!subslug && sub === topic.subtopics[0]) ? styles.subNavActive : ''}`
              }
            >
              {sub.title}
            </NavLink>
          ))}
        </nav>
        <Viz />
      </div>
    )
  }

  const Viz = topic.component
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.icon}>{topic.icon}</span>
        <div>
          <h1 className={styles.title}>{topic.title}</h1>
          <p className={styles.desc}>{topic.description}</p>
        </div>
      </div>
      <Viz />
    </div>
  )
}
