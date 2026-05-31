import hashlib
import bisect

class HashRingBasic:
    """
    ring = {
        182736481: "cache-server-01",
        573920184: "cache-server-02",
        891234567: "cache-server-03",
    }
    nodes = {"cache-server-01", "cache-server-02", "cache-server-03"}
    """
    def __init__(self):
        self.ring = {}      # position -> node name
        self.nodes = set()  # physical node names

    def add_node(self, node: str):
        position = self._hash(node)
        self.ring[position] = node
        self.nodes.add(node)

    def get_node(self, key: str) -> str:
        h = self._hash(key)
        # walk clockwise: find the first node position >= h
        # all keys between the previous node and this position belong to this node
        # NOTE: sorted() re-sorts on every call → O(N). production would use a
        # pre-sorted list + bisect.bisect_left() to make this O(log N)
        for pos in sorted(self.ring):
            if h <= pos:
                return self.ring[pos]
        # h is past the last node — wrap around to the first node to close the ring
        return self.ring[min(self.ring)]

    def remove_node(self, node: str):
        # no regrouping needed — removed node's keys automatically fall through
        # to the next node clockwise on the next get_node call
        position = self._hash(node)
        del self.ring[position]
        self.nodes.discard(node)

    def _hash(self, value: str) -> int:
        return int(hashlib.md5(value.encode()).hexdigest(), 16)


class HashRingProd:
    def __init__(self):
        """
        ring = {
            182736481: "cache-server-01",
            573920184: "cache-server-02",
            891234567: "cache-server-03",
        }
        nodes            = {"cache-server-01", "cache-server-02", "cache-server-03"}
        sorted_positions = [182736481, 573920184, 891234567]
        """
        self.ring = {}      # position -> node name
        self.nodes = set()  # physical node names
        self.sorted_positions = []

    def add_node(self, node: str):
        position = self._hash(node)
        self.ring[position] = node
        bisect.insort(self.sorted_positions, position) # inserts position in sorted order
        self.nodes.add(node)                            # also track the node name

    def get_node(self, key: str) -> str:
        h = self._hash(key)

        # in production we maintain sorted_positions at all times (updated in add_node/remove_node)
        # so get_node never calls sorted() - instead binary search gives O(log N) lookup
        i = bisect.bisect_left(self.sorted_positions, h)
        if i == len(self.sorted_positions):
            i = 0 # the same as: # h is past the last node — wrap around to the first node to close the ring
        # return the actual node
        return self.ring[self.sorted_positions[i]]

    def remove_node(self, node: str):
        # no regrouping needed — removed node's keys automatically fall through
        # to the next node clockwise on the next get_node call
        position = self._hash(node)
        del self.ring[position]
        self.sorted_positions.remove(position)
        self.nodes.discard(node)

    def _hash(self, value: str) -> int:
        return int(hashlib.md5(value.encode()).hexdigest(), 16)

if __name__ == "__main__":
    from simple_hash_router import SimpleHashRouter

    nodes = ["cache-server-01", "cache-server-02", "cache-server-03"]
    keys  = ["session:user_42", "session:user_99", "product:789", "order:001", "cart:user_7"]

    ring = HashRingProd()
    for n in nodes:
        ring.add_node(n)

    print("=== Routing with 3 nodes ===")
    before = {}
    for key in keys:
        before[key] = ring.get_node(key)
        print(f"  {key:25s} -> {before[key]}")

    print("\n=== After adding cache-server-04 ===")
    ring.add_node("cache-server-04")
    remapped = 0
    for key in keys:
        new_server = ring.get_node(key)
        changed = new_server != before[key]
        remapped += changed
        print(f"  {key:25s} -> {new_server}{'  *** remapped' if changed else ''}")
    print(f"\n{remapped}/{len(keys)} keys remapped (consistent hashing)")

    print("\n=== Same scenario with SimpleHashRouter ===")
    router = SimpleHashRouter(nodes[:])
    before_simple = {k: router.get_node(k) for k in keys}
    router.add_node("cache-server-04")
    remapped_simple = sum(router.get_node(k) != before_simple[k] for k in keys)
    print(f"{remapped_simple}/{len(keys)} keys remapped (simple hash router)")
