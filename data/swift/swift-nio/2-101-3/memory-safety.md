# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: memory safety

## memory safety

### Prevent Unsafe Pointer Escaping and Manage Storage Lifetimes in SwiftNIO

**Use when**

Handling low-level buffer pointer access via APIs like `withUnsafeReadableBytes`, `withVeryUnsafeMutableBytes`, or pooled buffer storage management in SwiftNIO.

**Secure rules**

**Rule 1: Do not escape unsafe buffer pointers outside the closure scope of `ByteBuffer` access methods.**

When using `ByteBuffer` APIs that grant closure-scoped access to underlying memory pointers, never allow the raw buffer pointers to escape the closure body because the pointers are transient and bound to internal backing storage. Copy data out of the buffer pointer within the closure rather than stashing or returning raw pointer references.

```swift
let dataCopy: [UInt8] = buffer.withUnsafeReadableBytes { ptr in
    Array(ptr)
}
```

**Rule 2: Balance storage `retain()` / `release()` calls when a `ByteBuffer` pointer escapes `withUnsafeReadableBytesWithStorageManagement`**

`ByteBuffer.withUnsafeReadableBytesWithStorageManagement` lets you keep a raw pointer to the buffer’s storage after the closure returns, but only if you **retain** the accompanying `Unmanaged` handle and later **release** it. Failing to pair these calls can free the memory while it is still in use.

```swift
// `buffer` contains data you want to pass to an async API without copying.
try buffer.withUnsafeReadableBytesWithStorageManagement { bytes, storage in
    // The raw pointer may outlive this closure, so pin the storage.
    storage.retain()

    someAsyncIO(bytes.baseAddress!, bytes.count) {
        // Once the asynchronous work is finished, release the storage.
        storage.release()
    }
}
```
