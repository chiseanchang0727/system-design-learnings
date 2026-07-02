import CachingViz from './caching/Visualization.jsx'
import CaseStudies from './caching/CaseStudies.jsx'
import InterviewGuide from './caching/InterviewGuide.jsx'
import ConsistentHashingViz from './consistent-hashing/Visualization.jsx'
import RedisViz from './redis/Visualization.jsx'
import BTreeViz from './b-tree/Visualization.jsx'
import CompositeIndexViz from './composite-index/Visualization.jsx'
import LSMTreeViz from './lsm-tree/Visualization.jsx'
import S2H3Viz from './s2-h3/Visualization.jsx'

export const topicGroups = [
  {
    title: 'Caching',
    topics: [
      {
        slug: 'caching',
        title: 'Caching',
        icon: '⚡',
        description: 'LRU eviction, write policies, and real-world cache architecture',
        subtopics: [
          { slug: 'lru-cache',       title: 'LRU Cache',       component: CachingViz },
          { slug: 'case-studies',    title: 'Case Studies',    component: CaseStudies },
          { slug: 'interview-guide', title: 'Interview Guide', component: InterviewGuide },
        ],
      },
      {
        slug: 'redis',
        title: 'Redis',
        icon: '🔴',
        description: 'Strings, Hashes, Lists, Sets, Sorted Sets, TTL — the data types behind every Redis use case',
        component: RedisViz,
      },
    ],
  },
  {
    title: 'Distributed Systems',
    topics: [
      {
        slug: 'consistent-hashing',
        title: 'Consistent Hashing',
        icon: '⬡',
        description: 'Hash ring, virtual nodes, node add/remove, key distribution',
        component: ConsistentHashingViz,
      },
    ],
  },
  {
    title: 'Database Indexing',
    topics: [
      {
        slug: 'b-tree',
        title: 'B-Tree',
        icon: '🌲',
        description: 'Node splits, tree growth, balanced depth — the index structure behind every database',
        component: BTreeViz,
      },
      {
        slug: 'composite-index',
        title: 'Composite Index',
        icon: '⌗',
        description: 'Column order, leftmost prefix rule, seek vs scan — why index column order matters',
        component: CompositeIndexViz,
      },
      {
        slug: 'lsm-tree',
        title: 'LSM Tree',
        icon: '📝',
        description: 'MemTable, SSTables, flush, compaction — the write-optimized structure behind Cassandra and RocksDB',
        component: LSMTreeViz,
      },
      {
        slug: 's2-h3',
        title: 'S2 / H3 Geospatial Index',
        icon: '🌐',
        description: 'Cell IDs, covering sets, resolution trade-offs — how nearby queries become fast index lookups',
        component: S2H3Viz,
      },
    ],
  },
]

export const topics = topicGroups.flatMap(g =>
  g.topics.flatMap(t => t.subtopics ? t.subtopics.map(s => ({ ...s, parentSlug: t.slug })) : [t])
)
