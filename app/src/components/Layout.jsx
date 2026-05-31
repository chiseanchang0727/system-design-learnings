import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { topics } from '../topics/index.js'
import styles from './Layout.module.css'

export default function Layout() {
  const location = useLocation()

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>SysDesign</span>
        </div>
        <ul className={styles.navList}>
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
              Home
            </NavLink>
          </li>
          <li className={styles.navSection}>Topics</li>
          {topics.map(topic => (
            <li key={topic.slug}>
              <NavLink
                to={`/topics/${topic.slug}`}
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                <span className={styles.topicIcon}>{topic.icon}</span>
                {topic.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
