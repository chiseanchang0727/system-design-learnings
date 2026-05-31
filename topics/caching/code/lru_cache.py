from __future__ import annotations
from collections import OrderedDict


class Node:
    __slots__ = ("key", "val", "prev", "next")

    def __init__(self, key: int, val: int) -> None:
        self.key = key
        self.val = val
        self.prev: Node | None = None
        self.next: Node | None = None


class LRUCache:
    """
    O(1) get and put using a doubly-linked list + hash map.

    - Doubly-linked list tracks access order (head = MRU, tail.prev = LRU).
    - Sentinel head/tail nodes eliminate edge-case checks.
    - Hash map gives O(1) node lookup by key.
    """

    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self.cache: dict[int, Node] = {}
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._move_to_front(node)
        return node.val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._move_to_front(node)
        else:
            if len(self.cache) == self.cap:
                lru = self.tail.prev
                self._remove(lru)
                del self.cache[lru.key]
            node = Node(key, value)
            self.cache[key] = node
            self._insert_front(node)

    def _remove(self, node: Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _insert_front(self, node: Node) -> None:
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def _move_to_front(self, node: Node) -> None:
        self._remove(node)
        self._insert_front(node)


class LRUCacheSimple:
    """Same semantics using Python's OrderedDict — for quick usage."""

    def __init__(self, capacity: int) -> None:
        self.cap = capacity
        self._od: OrderedDict[int, int] = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self._od:
            return -1
        self._od.move_to_end(key)
        return self._od[key]

    def put(self, key: int, value: int) -> None:
        if key in self._od:
            self._od.move_to_end(key)
        self._od[key] = value
        if len(self._od) > self.cap:
            self._od.popitem(last=False)


if __name__ == "__main__":
    cache = LRUCache(3)
    cache.put(1, 10)
    cache.put(2, 20)
    cache.put(3, 30)
    assert cache.get(1) == 10   # access 1 → MRU
    cache.put(4, 40)            # evicts 2 (LRU)
    assert cache.get(2) == -1   # miss
    assert cache.get(3) == 30
    assert cache.get(4) == 40
    print("All assertions passed.")
