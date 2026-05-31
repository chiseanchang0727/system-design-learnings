import hashlib

class SimpleHashRouter:
    def __init__(self, nodes: list[str]):
        self.nodes = nodes

    def get_node(self, key):
        # encode() → bytes, md5() → 128-bit hash, hexdigest() → 32-char hex string, int(...,16) → integer
        index = int(hashlib.md5(key.encode()).hexdigest(), 16) % len(self.nodes)
        return self.nodes[index]

    def add_node(self, node: str):
        self.nodes.append(node)

    def remove_node(self, node: str):
        self.nodes.remove(node)


if __name__ == "__main__":
    print("=== MD5 hash chain example ===")
    key = "session:user_42"
    step1 = key.encode()
    step2 = hashlib.md5(step1)
    step3 = step2.hexdigest()
    step4 = int(step3, 16)
    print(f"  str      : {key}")
    print(f"  encode() : {step1}")
    print(f"  md5()    : {step2}")
    print(f"  hexdigest: {step3}")
    print(f"  int      : {step4}")
    print(f"  % 3      : {step4 % 3}")
    print()


    nodes = ["cache-server-01", "cache-server-02", "cache-server-03"]
    router = SimpleHashRouter(nodes)

    keys = ["session:user_42", "session:user_99", "product:789", "order:001", "cart:user_7"]

    print("=== Routing with 3 nodes ===")
    for key in keys:
        print(f"  {key:25s} -> {router.get_node(key)}")

    print("\n=== After adding cache-server-04 ===")
    router.add_node("cache-server-04")
    remapped = 0
    for key in keys:
        new_server = router.get_node(key)
        changed = new_server != SimpleHashRouter(nodes[:3]).get_node(key)
        remapped += changed
        print(f"  {key:25s} -> {new_server}{'  *** remapped' if changed else ''}")

    print(f"\n{remapped}/{len(keys)} keys remapped after adding 1 node")