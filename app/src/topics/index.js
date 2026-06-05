import CachingViz from './caching/Visualization.jsx'
import ConsistentHashingViz from './consistent-hashing/Visualization.jsx'
import BTreeViz from './b-tree/Visualization.jsx'
import CompositeIndexViz from './composite-index/Visualization.jsx'

export const topics = [
  {
    slug: 'caching',
    title: 'Caching',
    icon: '⚡',
    description: 'LRU, LFU, write-through, write-back, eviction policies',
    component: CachingViz,
  },
  {
    slug: 'consistent-hashing',
    title: 'Consistent Hashing',
    icon: '⬡',
    description: 'Hash ring, virtual nodes, node add/remove, key distribution',
    component: ConsistentHashingViz,
  },
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
]
