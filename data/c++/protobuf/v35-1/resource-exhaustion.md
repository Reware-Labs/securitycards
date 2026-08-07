# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: resource exhaustion

## resource exhaustion

### Enforce Input Size, Recursion, and Descriptor Limits to Prevent Resource Exhaustion

**Use when**

Parsing, deserializing, or processing untrusted binary, JSON, text format, or descriptor payloads across various Protocol Buffers language runtimes.

**Secure rules**

**Rule 1: Enforce strict recursion depth limits when parsing untrusted text-format inputs.**

When parsing untrusted ASCII text-format protocol buffer payloads, use `TextFormat::Parser` and configure safe recursion limits via `SetRecursionLimit()` to restrict maximum nesting depth and prevent stack overflow crashes.

```cpp
google::protobuf::TextFormat::Parser parser;
parser.SetRecursionLimit(100);
MyMessage message;
if (!parser.Parse(input_stream, &message)) {
  // Handle parsing failure
}
```

**Rule 2: Configure explicit recursion depth limits during JSON deserialization.**

When deserializing JSON payloads using `JsonParser` or `JsonFormat.Parser`, enforce reasonable recursion depth limits using custom settings to prevent unbounded stack allocation and denial-of-service conditions.

```csharp
var settings = JsonParser.Settings.Default.WithRecursionLimit(64);
var parser = new JsonParser(settings);
MyMessage message = parser.Parse<MyMessage>(untrustedJsonString);
```

**Rule 3: Set explicit input size limits on CodedInputStream instances.**

Configure size limits on `CodedInputStream` via `setSizeLimit()` when reading data from untrusted network sources or files to prevent large payload allocations and `OutOfMemoryError`.

```java
CodedInputStream stream = CodedInputStream.newInstance(inputStream);
stream.setSizeLimit(64 * 1024 * 1024);
```

**Rule 4: Instantiate `Arena` with a defensive `ArenaOptions` when parsing untrusted data**

`Arena` will keep requesting new memory blocks as needed, so give it *tight but reasonable* block-size parameters and (optionally) a quota-enforcing allocator:

```cpp
// Defensive options: small first block, capped growth, custom allocator.
google::protobuf::ArenaOptions opts;
opts.start_block_size = 1024;              // 1 KiB first block
opts.max_block_size   = 64 * 1024;         // 64 KiB per additional block

// Example allocator that aborts once the process-wide quota is exceeded.
void* SafeAlloc(size_t n) {
  static std::atomic<size_t> used{0};
  const size_t kQuota = 10 * 1024 * 1024;   // 10 MiB
  if (used + n > kQuota) std::abort();
  used += n;
  return std::malloc(n);
}
void SafeFree(void* p, size_t n) {
  std::free(p);
  used -= n;
}
opts.block_alloc   = &SafeAlloc;
opts.block_dealloc = &SafeFree;

google::protobuf::Arena arena(opts);        // use this arena for parsing
```
