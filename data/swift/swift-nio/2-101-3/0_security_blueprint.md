# Security blueprint

Repository: `https://github.com/apple/swift-nio#2.101.3`

## Security posture

Swift NIO provides high-performance asynchronous networking primitives and file I/O operations where developers must explicitly manage security boundaries, permissions, and resource limits. While the library hardens default protocol parsers and prevents common request-smuggling vectors, developers remain responsible for secure file handling, proper thread isolation, and strict input validation. Security-sensitive surfaces include network pipelines, protocol upgrades, file descriptors, and untrusted buffer decoders. Any violation of protocol constraints, thread assumptions, or memory boundaries must fail closed to protect system and application integrity.

## Essential implementation rules

1. **Enforce Strict File Permissions and Exclusive Creation Options**

Always explicitly specify restrictive permissions such as `FilePermissions(rawValue: 0o700)` or `.ownerReadWrite` when creating files or directories to prevent unauthorized local access. Use exclusive creation flags and transactional file writing to prevent time-of-check to time-of-use race conditions and incomplete materialization.

2. **Validate Thread Isolation and EventLoopGroup Compatibility**

Use `NIORawSocketBootstrap(validatingGroup:)` to safely verify compatibility when receiving event loop groups dynamically, avoiding unrecoverable precondition crashes. Enforce state mutation thread isolation explicitly using `preconditionInEventLoop()`.

3. **Validate Integer Boundaries and Buffer Indices Before Instantiation**

Verify that raw integer inputs fit within valid byte boundaries using initializers like `UInt8(exactly:)` and `UInt16(exactly:)` before creating types like `NIOIPProtocol` or `WebSocketErrorCode`. Always check offset bounds or rely on safe optional-returning getters when performing random access on `ByteBuffer` instances.

4. **Configure Leftover Bytes Strategy and Outbound Header Validators**

Explicitly specify a leftover bytes strategy such as `.forwardBytes` when setting up HTTP client upgrade handlers to ensure proper boundary control and prevent data truncation. Ensure outbound header validators matching the pipeline role, such as `NIOHTTPRequestHeadersValidator` or `NIOHTTPResponseHeadersValidator`, are added to block malformed messages.

5. **Resolve Configuration Paths via System User Database SPI**

Resolve the current user's home directory securely from the system password database using `Libc.homeDirectoryFromPasswd()` under the `_NIOFileSystem` testing SPI instead of relying on forgeable environment variables like `HOME`.

6. **Manage Raw File Descriptors Securely and Set Close-On-Exec**

Ensure raw file descriptors do not escape closure boundaries when using `withUnsafeDescriptor`, and manually manage descriptor lifecycles when using `detachUnsafeFileDescriptor()`. Configure open options with `closeOnExec: true` to prevent handle leaks across subprocess boundaries.

7. **Prevent Symlink Traversal and Validate UNIX Domain Sockets**

Set `followSymbolicLinks = false` in `OpenOptions` to prevent transparent redirection through symbolic links. When rebinding UNIX domain sockets, pass `cleanupExistingSocketFile: true` to safely verify and unlink socket files.

8. **Validate HTTP Headers and Use Canonical Form Subscripting**

Verify that HTTP header names and values consist strictly of valid ASCII and RFC 9110 compliant characters without control characters before population. Retrieve comma-delimited headers using `HTTPHeaders[canonicalForm:]` to prevent parsing corruption of embedded dates and list values.

9. **Enforce Strict HTTP Framing and Parser Security**

Maintain automatically set framing headers in HTTP encoders and keep outbound header validation enabled to prevent response splitting. Rely on Swift NIO's standard `HTTPDecoder` with all lenient flags disabled rather than modifying internal llhttp flags.

10. **Secure Protocol Upgrades, ALPN, and WebSocket Handlers**

Handle both `.negotiated` and `.fallback` cases explicitly in `ApplicationProtocolNegotiationHandler`, closing the channel if unsupported protocols are selected. Keep `automaticErrorHandling` enabled on WebSocket upgraders to ensure protocol violations trigger proper termination.

11. **Manage Unsafe Pointer Lifetimes Without Leaking Storage**

Never allow transient underlying memory pointers from `ByteBuffer` access methods to escape their closure scope. When using `withUnsafeReadableBytesWithStorageManagement`, strictly pair storage `retain()` and `release()` calls to prevent use-after-free or memory leaks.

12. **Bind Network Interfaces Safely and Control Dual-Stack Exposure**

Safely unwrap optional network device address fields on `NIONetworkDevice` instead of force-unwrapping them. Explicitly configure socket options like `ipv6_v6only` to control IPv4-IPv6 dual-stack exposure and prevent unintended reachability.

13. **Enforce HTTP and WebSocket Resource Limits**

Pass an explicit `NIOHTTPDecoderLimitConfiguration` instance when initializing HTTP decoders, and specify a maximum frame size limit when initializing WebSocket server upgraders or decoders to prevent memory and CPU exhaustion.

14. **Enforce Size Limits When Reading Files and Asynchronous Sequences**

Provide a strict `maximumSizeAllowed` limit or stream large files incrementally using `readChunks()` when reading files into memory. Pass a strict maximum byte limit when calling `collect(upTo:)` on asynchronous sequences and catch `NIOTooManyBytesError` to reject oversized payloads.
