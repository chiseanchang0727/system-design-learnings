import { Outlet, NavLink, Link } from 'react-router-dom'
import { topicGroups } from '../topics/index.js'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}>⬡</span>
          <span className={styles.brandName}>SysDesign</span>
        </Link>

        <ul className={styles.navList}>
          {topicGroups.map(group => (
            <li key={group.title}>
              <div className={styles.navSection}>{group.title}</div>
              <ul className={styles.groupList}>
                {group.topics.map(topic =>
                  topic.subtopics ? (
                    <li key={topic.slug}>
                      <div className={styles.navParent}>
                        <span className={styles.topicIcon}>{topic.icon}</span>
                        {topic.title}
                      </div>
                      <ul className={styles.subtopicList}>
                        {topic.subtopics.map(sub => (
                          <li key={sub.slug}>
                            <NavLink
                              to={`/topics/${topic.slug}/${sub.slug}`}
                              className={({ isActive }) =>
                                isActive ? `${styles.subLink} ${styles.active}` : styles.subLink
                              }
                            >
                              {sub.title}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={topic.slug}>
                      <NavLink
                        to={`/topics/${topic.slug}`}
                        className={({ isActive }) =>
                          isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                        }
                      >
                        <span className={styles.topicIcon}>{topic.icon}</span>
                        {topic.title}
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
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
