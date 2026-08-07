# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: input contract definition

## input contract definition

### Validate index bounds and header values before processing buffer or protocol input

**Use when**

Developing networking code using Swift NIO where untrusted input is passed to buffer indexing APIs or HTTP header population methods.

**Secure rules**

**Rule 1: Validate index bounds before performing random access on `ByteBuffer`**

Check offset bounds or rely on safe get methods that return optional values when out of range to prevent runtime crashes caused by invalid index access.

```swift
func readValue(at offset: Int, from buffer: ByteBuffer) -> Int? {
    guard offset >= buffer.readerIndex && offset < buffer.writerIndex else {
        return nil
    }
    return buffer.getInteger(at: offset, as: Int.self)
}
```

**Rule 2: Validate header names for ASCII compliance before adding them to `HTTPHeaders`**

Verify that header field names consist strictly of ASCII characters before calling `HTTPHeaders.add(name:value:)` to prevent runtime precondition failures and application crashes.

```swift
func addHeaderSafely(name: String, value: String, headers: inout HTTPHeaders) -> Bool {
    guard name.utf8.allSatisfy({ $0 <= 127 }) else {
        return false
    }
    headers.add(name: name, value: value)
    return true
}
```

**Rule 3: Validate Unix domain socket path lengths before address instantiation**

Handle `SocketAddressError.unixDomainSocketPathTooLong` or pre-validate the path length before initialization to ensure path strings do not exceed the underlying buffer limitations.

```swift
do {
    let address = try SocketAddress(unixDomainSocketPath: pathString)
} catch SocketAddressError.unixDomainSocketPathTooLong {}
```
