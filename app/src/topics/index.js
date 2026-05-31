import CachingViz from './caching/Visualization.jsx'
import ConsistentHashingViz from './consistent-hashing/Visualization.jsx'

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
]
