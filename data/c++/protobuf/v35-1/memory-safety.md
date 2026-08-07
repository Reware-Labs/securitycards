# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: memory safety

## memory safety

### Synchronize Thread Lifecycles and Validate Alignment When Managing Arena Memory

**Use when**

Developing multi-threaded Protobuf applications that utilize custom arena block allocators or coordinate arena destruction and resets across multiple threads.

**Secure rules**

**Rule 1: Ensure custom arena block allocators maintain strict memory alignment and handle allocation and deallocation symmetrically.**

When configuring custom block allocation routines via `ArenaOptions` or `AllocationPolicy`, guarantee that `block_alloc` returns correctly aligned memory matching system alignment requirements and safely handles allocation failures. Custom deallocation functions must symmetrically release memory provided by `block_alloc` without causing double-freeing or memory leaks.

```cpp
void* CustomBlockAlloc(size_t size) {
  void* ptr = nullptr;
  if (posix_memalign(&ptr, alignof(std::max_align_t), size) != 0) {
    return nullptr;
  }
  return ptr;
}

void CustomBlockDealloc(void* ptr, size_t size) {
  free(ptr);
}
```

**Rule 2: Synchronize thread completion before destroying or resetting arenas.**

Ensure proper lifecycle synchronization when resetting or destroying arenas containing active objects or multi-threaded allocations. Join all worker threads that perform allocations on the `Arena` before destroying or resetting the arena to prevent memory corruption and use-after-free vulnerabilities.

```cpp
google::protobuf::Arena arena;
std::vector<std::thread> workers;
for (int i = 0; i < 4; ++i) {
  workers.emplace_back([&arena]() {
    auto* msg = google::protobuf::Arena::Create<MyMessage>(&arena);
  });
}
for (auto& worker : workers) {
  worker.join();
}
```
