# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: escape hatch

## escape hatch

### Restrict raw file descriptor escape hatches in file operations

**Use when**

Interacting with low-level file handles or performing native system operations using raw POSIX file descriptors.

**Secure rules**

**Rule 1: Prevent file descriptors from escaping handle closure boundaries and avoid manual closure inside escape hatch blocks.**

When using the `withUnsafeDescriptor` escape hatch, ensure the raw `FileDescriptor` does not escape the closure boundary and never call `close` on it inside the closure. Use `detachUnsafeFileDescriptor()` only when explicit transfer of descriptor ownership is intended.

```swift
try await handle.withUnsafeDescriptor { descriptor in
    // Execute native system operations without storing or closing descriptor
}

let rawDescriptor = try handle.detachUnsafeFileDescriptor()
// Caller is now responsible for closing rawDescriptor
```

**Rule 2: Manage detached file descriptors manually when ownership is relinquished.**

Once detached via `detachUnsafeFileDescriptor()`, the file handle manager no longer handles the file descriptor lifecycle, requiring explicit manual closure to prevent resource leaks and descriptor reuse vulnerabilities.

```swift
let descriptor = try handle.detachUnsafeFileDescriptor()
defer {
    try? descriptor.close()
}
```
