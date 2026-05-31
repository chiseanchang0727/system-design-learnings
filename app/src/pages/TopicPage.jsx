import { useParams } from 'react-router-dom'
import { topics } from '../topics/index.js'
import styles from './TopicPage.module.css'

export default function TopicPage() {
  const { slug } = useParams()
  const topic = topics.find(t => t.slug === slug)

  if (!topic) {
    return <div className={styles.notFound}>Topic not found.</div>
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
