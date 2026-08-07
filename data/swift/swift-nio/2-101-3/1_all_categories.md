# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`

## Category: access control

### Enforce Strict File Permissions and Ownership Checks

**Use when**

Creating or modifying files and directories, or inspecting file metadata for authorization and permission checks in Swift NIO.

**Secure rules**

**Rule 1: Set explicit restrictive permissions when creating files or directories to prevent unauthorized local access.**

Always explicitly specify restrictive permissions such as `.ownerReadWrite` or `FilePermissions(rawValue: 0o700)` when creating directories or files that store sensitive data, configuration, keys, or internal application state, avoiding default umask settings.

```swift
let writeOptions = OpenOptions.Write.newFile(
    replaceExisting: false,
    permissions: [.ownerRead, .ownerWrite]
)
```

**Rule 2: Use normalized portable FileInfo properties for authorization and ownership validation.**

When verifying file system metadata to enforce authorization and ownership, inspect normalized portable fields like `fileInfo.userID` on `FileInfo` rather than platform-specific status structures to avoid authorization bypasses.

```swift
let fileInfo: FileInfo = try await fileSystem.info(for: filePath)
guard fileInfo.userID.rawValue == expectedOwnerUID else {
    throw FileAccessError.unauthorizedOwner
}
```

**Rule 3: Modify permissions on active file handles to prevent TOCTOU race conditions.**

Use descriptor-backed permission modification APIs such as `replacePermissions` on active `SystemFileHandle` instances instead of modifying permissions by string path.

```swift
try await handle.replacePermissions(.ownerReadWrite)
```


## Category: api contract misuse

### Validate EventLoopGroup Compatibility and Thread Isolation

**Use when**

When configuring network bootstraps with dynamic event loop groups or verifying event loop thread isolation for state mutations.

**Secure rules**

**Rule 1: Validate event loop group compatibility safely using `NIORawSocketBootstrap(validatingGroup:)`.**

Use `NIORawSocketBootstrap(validatingGroup:)` to validate compatibility safely when receiving event loop groups dynamically or from external callers, preventing unrecoverable precondition failure crashes.

```swift
guard let bootstrap = NIORawSocketBootstrap(validatingGroup: eventLoopGroup) else {
    throw ChannelError.incompatibleEventLoopGroup
}

let channel = try await bootstrap.bind(
    host: "127.0.0.1",
    ipProtocol: .icmp
)
```

**Rule 2: Enforce thread isolation verification using `preconditionInEventLoop()`.**

Always use `preconditionInEventLoop()` when thread isolation verification is required for correctness, as `inEventLoop` is an optimization point that can produce false-negatives.

```swift
func updateState() {
    eventLoop.preconditionInEventLoop()
    self.state.mutate()
}
```


### Validate Integer Input Ranges Before Library API Instantiation

**Use when**

When parsing dynamic configuration values, network inputs, or external protocol constants into SwiftNIO types that have strict numeric boundaries.

**Secure rules**

**Rule 1: Validate integer inputs to fit within valid byte boundaries before initializing `NIOIPProtocol`.**

Always validate integer inputs or convert them safely via `UInt8(exactly:)` prior to instantiating `NIOIPProtocol` to prevent unhandled runtime fatal errors caused by out-of-range values.

```swift
func parseIPProtocol(from rawInt: Int) -> NIOIPProtocol? {
    guard let uint8Val = UInt8(exactly: rawInt) else {
        return nil
    }
    return NIOIPProtocol(rawValue: uint8Val)
}
```

**Rule 2: Verify integer bounds before initializing `WebSocketErrorCode` instances.**

Use `UInt16(exactly:)` to safely check integer values before instantiating `WebSocketErrorCode` to prevent internal conversion traps and process crashes from out-of-range values.

```swift
func parseErrorCode(from rawCode: Int) -> WebSocketErrorCode? {
    guard UInt16(exactly: rawCode) != nil else {
        return nil
    }
    return WebSocketErrorCode(codeNumber: rawCode)
}
```


## Category: boundary control

### Configure Leftover Bytes Strategy During Protocol Upgrades

**Use when**

When implementing protocol upgrades such as transitioning from HTTP/1.1 to WebSocket using client upgrade handlers where payload data may arrive in the same TCP chunk as the protocol response head.

**Secure rules**

**Rule 1: Explicitly specify a leftover bytes strategy when configuring HTTP client upgrade handlers to ensure proper boundary control and prevent data truncation or payload injection.**

When setting up `addHTTPClientHandlers(leftOverBytesStrategy:withClientUpgrade:)`, supply an explicit strategy like `.forwardBytes` to securely handle buffered payload data crossing from the network socket into the upgraded protocol pipeline.

```swift
let upgradeConfig: NIOHTTPClientUpgradeSendableConfiguration = (
    upgraders: [clientUpgrader],
    completionHandler: { context in
        context.pipeline.removeHandler(clientHTTPHandler, promise: nil)
    }
)

try channel.pipeline.addHTTPClientHandlers(
    leftOverBytesStrategy: .forwardBytes,
    withClientUpgrade: upgradeConfig
).wait()
```


## Category: configuration source integrity

### Use System User Database Instead of Environment Variables for Configuration Path Resolution

**Use when**

Resolving home directory paths or security-sensitive configuration file locations within application startup or user session initialization.

**Secure rules**

**Rule 1: Resolve the current user’s home directory from the password database (SPI) instead of relying on environment variables**

`Libc.homeDirectoryFromPasswd()` queries the system user database with `getpwuid_r`, producing a trusted path that cannot be forged through `HOME` or `USERPROFILE`.
Because this API is published under Swift NIO’s **Testing SPI**, add an `@_spi(Testing)` import for `_NIOFileSystem` (or `NIOFileSystem`) before calling it.

```swift
@_spi(Testing) import _NIOFileSystem   // exposes Libc SPI symbols

#if canImport(Darwin) || canImport(Glibc) || canImport(Musl) || canImport(Bionic)
switch Libc.homeDirectoryFromPasswd() {
case .success(let secureHomeDir):
    let configPath = secureHomeDir.appending("config.json")
    // safely use `configPath`
case .failure(let errno):
    // handle lookup failure (log, throw, etc.)
}
#endif
```


## Category: escape hatch

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


## Category: file handling

### Enforce Strict File Creation Options and Explicit Permissions

**Use when**

When creating new files or replacing existing files on disk to prevent race conditions, unauthorized access, or partial file materialization.

**Secure rules**

**Rule 1: Specify explicit file permissions when creating files.**

Provide explicit `FilePermissions` when invoking file opening operations with the `.create` option to prevent runtime precondition failures and avoid exposing persistent data to unauthorized local users.

```swift
let path = FilePath("secure_data.txt")
let permissions: FilePermissions = [.ownerRead, .ownerWrite]
let result = directoryFd.open(
    atPath: path,
    mode: .writeOnly,
    options: [.create, .exclusive],
    permissions: permissions
)
```

**Rule 2: Use exclusive file creation and rename flags to prevent destructive race conditions.**

Use `OpenOptions.Write.newFile(replaceExisting: false)` or exclusive destination flags during file renames to guarantee atomic operations and prevent time-of-check to time-of-use race conditions.

```swift
var options = OpenOptions.Write.newFile(replaceExisting: false, permissions: [.ownerReadWrite])
options.followSymbolicLinks = false
```

**Rule 3: Create new files transactionally and roll back writes on error**

When you need to write fresh data, open the path with `OpenOptions.Write.newFile(replaceExisting: false)`.
* The option’s default `transactionalCreation` flag delays materialisation until the handle is closed without error.
* The `withFileHandle` helper automatically closes the handle with `makeChangesVisible: false` if your write block throws, so an incomplete file is never left on disk.

```swift
import _NIOFileSystem        // part of Swift NIO

let bytes: [UInt8] = [/* … */]
let safeOptions = OpenOptions.Write.newFile(replaceExisting: false)

try await FileSystem.shared.withFileHandle(
    forWritingAt: "/var/data/new-image.bin",
    options: safeOptions
) { handle in
    // All writes are buffered until successful close.
    try await handle.write(contentsOf: bytes, toAbsoluteOffset: 0)
    // throw here to test rollback behaviour
}
```


### Prevent Symlink Traversal and Enforce File Containment in Untrusted Directories

**Use when**

When opening, copying, or unlinking files and directories within shared, temporary, or user-writable paths where untrusted symbolic links or unauthorized entries might be present.

**Secure rules**

**Rule 1: Prevent automatic symbolic-link resolution when opening files or directories**

When you need to make sure that a path is **not** transparently redirected through a symbolic link (e.g., to avoid unexpected access), set `followSymbolicLinks` to `false` in the corresponding `OpenOptions` variant.
Swift NIO will pass `O_NOFOLLOW` to the underlying `open(2)` call and throw an error if the final component is a symlink.

```swift
import NIOFS
import SystemPackage

// Read-only open that fails if the target is a symbolic link.
var opts = OpenOptions.Read()
opts.followSymbolicLinks = false   // inserts .noFollow

let fdOptions = FileDescriptor.OpenOptions(opts) // contains .noFollow
```

**Rule 2: Validate entry types during recursive directory or file copy operations.**

Utilize the `shouldCopyItem` predicate callback in copy operations to explicitly check entry types and reject dangerous or unsupported items such as FIFOs, sockets, or unwanted symbolic links.

```swift
try await FileSystem.shared.copyItem(
    at: source,
    to: destination,
    strategy: .platformDefault,
    replaceExisting: false,
    shouldProceedAfterError: { entry, error in throw error },
    shouldCopyItem: { entry, dest in
        return entry.type == .regular || entry.type == .directory
    }
)
```

**Rule 3: Safely remove stale UNIX domain socket files before binding**

When rebinding to a UNIX domain socket, pass **`cleanupExistingSocketFile: true`** to `bind(unixDomainSocketPath:cleanupExistingSocketFile:)`.
Swift NIO will call `BaseSocket.cleanupSocket`, which unlinks the file *only* if it is of socket type and otherwise throws `UnixDomainSocketPathWrongType`, protecting against symlink-based or non-socket deletions.

```swift
import NIOPosix

let group = MultiThreadedEventLoopGroup(numberOfThreads: System.coreCount)
defer { try? group.syncShutdownGracefully() }

let bootstrap = ServerBootstrap(group: group)
// …configure options and childChannelInitializer as needed…

let udsPath = "/tmp/myapp.sock"

do {
    // Remove any stale socket file safely, then bind.
    let channel = try bootstrap
        .bind(unixDomainSocketPath: udsPath,
              cleanupExistingSocketFile: true)
        .wait()

    // Server is now listening on the UDS.
    try channel.closeFuture.wait()
} catch BaseSocket.UnixDomainSocketPathWrongType {
    // Existing file was not a socket – log and abort startup.
}
```


## Category: injection

### Validate HTTP Header Names and Values to Prevent Injection

**Use when**

Constructing dynamic HTTP headers in SwiftNIO before outbound transmission to prevent header injection and request smuggling.

**Secure rules**

**Rule 1: Validate dynamically generated HTTP header names and values to ensure they contain only RFC 9110 compliant characters before adding them to `HTTPHeaders`.**

Check that header values do not contain ASCII control characters such as CR or LF unless permitted as HTAB, utilizing SwiftNIO's checks or explicit validation routines to prevent protocol violations.

```swift
func addSafeHeader(headers: inout HTTPHeaders, name: String, value: String) throws {
    guard !value.unicodeScalars.contains(where: { $0.value < 0x20 && $0.value != 0x09 }) else {
        throw HeaderValidationError.invalidHeaderValue
    }
    headers.add(name: name, value: value)
}
```


## Category: input contract definition

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


## Category: input interpretation safety

### Use Canonical Form Subscripting for Comma-Delimited Headers

**Use when**

When processing comma-separated HTTP headers like `connection` or `set-cookie` using `HTTPHeaders`.

**Secure rules**

**Rule 1: Retrieve comma-delimited HTTP header values using canonical form subscripting to prevent parsing corruption of embedded dates.**

Use `HTTPHeaders[canonicalForm:]` instead of manually splitting header strings on commas. This ensures that list-based headers are properly decomposed while preserving values like `Set-Cookie` that contain commas within HTTP date strings.

```swift
let connectionDirectives = headers[canonicalForm: "connection"]
for directive in connectionDirectives {
    // Safely evaluate normalized header tokens
}

let rawCookies = headers[canonicalForm: "set-cookie"]
```


## Category: interface protocol hardening

### Enforce HTTP framing and header validation rules

**Use when**

Configuring HTTP client and server channels, encoders, and pipelines in SwiftNIO to prevent request/response smuggling and header injection.

**Secure rules**

**Rule 1: Keep automatic framing headers enabled in HTTP encoders.**

Maintain automaticallySetFramingHeaders set to true in HTTPRequestEncoder.Configuration and HTTPResponseEncoder.Configuration to prevent conflicting Content-Length or Transfer-Encoding headers from being emitted.

```swift
let config = HTTPResponseEncoder.Configuration()
let responseEncoder = HTTPResponseEncoder(configuration: config)
```

**Rule 2: Maintain default outbound header validation to prevent response splitting.**

Ensure outbound header validation remains enabled when configuring HTTP client or server pipelines so that invalid tokens or CR/LF characters cannot be encoded directly into the stream.

```swift
channel.pipeline.configureHTTPServerPipeline(
    withOutboundHeaderValidation: true
).flatMap {
    // Pipeline configured safely
}
```

**Rule 3: Attach the correct HTTP header validator for the pipeline’s role**

Swift NIO ships two outbound validators:
* **`NIOHTTPRequestHeadersValidator`** — for *clients*, it enforces valid HTTP methods, URIs, and request-header syntax.
* **`NIOHTTPResponseHeadersValidator`** — for *servers*, it enforces status-code and response-header constraints.

Both validators are added automatically by `HTTPPipelineSetup.addHTTPClientHandlers/ServerHandlers`, but if you build a pipeline manually you **must** add the matching validator yourself to block malformed messages that could bypass downstream security logic.

```swift
import NIOCore
import NIOHTTP1
import NIOPosix

let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
defer { try! group.syncShutdownGracefully() }

// CLIENT: validate outbound requests.
let client = ClientBootstrap(group: group).channelInitializer { channel in
    channel.pipeline.addHandlers([
        HTTPRequestEncoder(),
        NIOHTTPRequestHeadersValidator()     // <-- for clients
    ])
}

// SERVER: validate outbound responses.
let server = ServerBootstrap(group: group).childChannelInitializer { channel in
    channel.pipeline.addHandlers([
        HTTPResponseEncoder(),
        NIOHTTPResponseHeadersValidator()    // <-- for servers
    ])
}
```

**Rule 4: Rely on NIOHTTP1’s standard `HTTPDecoder` (e.g. through `HTTPServerPipelineHandler`) instead of importing `CNIOLLHTTP` or toggling llhttp “lenient” flags**

Swift NIO exposes a fully–hard-ended HTTP/1.1 parser via `HTTPDecoder`.
The decoder instantiates **llhttp** with **all lenient flags disabled** and the `CNIOLLHTTP` module is tagged `private`/`implementationOnly`, so application code must not attempt to tweak those flags directly.
Use the public server pipeline helpers and let NIO keep request-smuggling vectors closed.

```swift
import NIOCore
import NIOPosix
import NIOHTTP1

let group = MultiThreadedEventLoopGroup(numberOfThreads: System.coreCount)
defer { try? group.syncShutdownGracefully() }

let bootstrap = ServerBootstrap(group: group)
    .serverChannelOption(ChannelOptions.backlog, value: 256)
    .childChannelInitializer { channel in
        channel.pipeline.addHandlers([
            HTTPServerPipelineHandler(),   // strict HTTP/1 parser & pipelining safety
            MyRequestHandler()             // your app logic
        ])
    }

let server = try bootstrap.bind(host: "0.0.0.0", port: 8080).wait()
print("HTTP server running on \(server.localAddress!)")
try server.closeFuture.wait()
```


### Validate protocol upgrades and ALPN negotiations securely

**Use when**

Configuring TLS, ALPN callbacks, and protocol upgraders in SwiftNIO pipelines to prevent protocol confusion and downgrade attacks.

**Secure rules**

**Rule 1: Validate ALPN negotiation results and handle fallback securely.**

When configuring an ApplicationProtocolNegotiationHandler, handle both .negotiated and .fallback cases explicitly, verify that negotiated protocol strings match expected identifiers, and close the channel if an unsupported protocol is selected.

```swift
let alpnHandler = ApplicationProtocolNegotiationHandler { result, channel in
    switch result {
    case .negotiated("h2"):
        return channel.pipeline.configureHTTP2Pipeline(mode: .server)
    case .negotiated("http/1.1"):
        return channel.pipeline.configureHTTPServerPipeline()
    case .negotiated, .fallback:
        return channel.close()
    }
}
```

**Rule 2: Keep automatic error handling enabled to safely handle protocol violations.**

Keep automaticErrorHandling enabled when setting up WebSocket upgraders unless explicit protocol error handling is implemented in user pipeline handlers to ensure protocol violations trigger proper termination.

```swift
let upgrader = NIOWebSocketServerUpgrader(
    automaticErrorHandling: true,
    shouldUpgrade: { channel, reqHead in
        channel.eventLoop.makeSucceededFuture(HTTPHeaders())
    },
    upgradePipelineHandler: { channel, reqHead in
        channel.eventLoop.makeSucceededFuture(())
    }
)
```


## Category: memory safety

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


## Category: network boundary

### Validate network interface properties and bind sockets explicitly

**Use when**

Configuring network boundary bindings and inspecting host network interfaces using SwiftNIO socket and interface APIs.

**Secure rules**

**Rule 1: Safely unwrap optional network device address fields instead of force-unwrapping them.**

When inspecting network boundaries or target interfaces on a host, use `NIONetworkDevice` and always safely unwrap optional network address fields such as `address`, `netmask`, `broadcastAddress`, and `pointToPointDestinationAddress` to prevent runtime crashes and invalid network boundary assumptions across operating systems.

```swift
func bindToDeviceAddress(device: NIONetworkDevice) {
    guard let address = device.address else {
        return
    }
}
```

**Rule 2: Explicitly set `ipv6_v6only` to control IPv4–IPv6 dual-stack exposure**

Swift NIO creates IPv6 sockets with `ipv6_v6only` cleared (value 0), which means the same socket will also accept IPv4 traffic via IPv4-mapped addresses. To prevent unintended IPv4 reachability—or to guarantee dual-stack support consistently across platforms—set the option yourself before binding.

```swift
import NIOCore
import NIOPosix

let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
defer { try! group.syncShutdownGracefully() }

// Build a ChannelOption that targets the IPv6 level and the ipv6_v6only name.
let v6OnlyOption = ChannelOptions.Types.SocketOption(
    level: .ipv6,
    name: .ipv6_v6only
)

let bootstrap = ServerBootstrap(group: group)
    // Set to 1 for IPv6-only, or 0 for explicit dual-stack.
    .serverChannelOption(v6OnlyOption, value: 1)
    .childChannelInitializer { channel in
        channel.eventLoop.makeSucceededFuture(())
    }

let channel = try bootstrap.bind(host: "::", port: 8080).wait()
print("Listening on \(channel.localAddress!)")
try channel.closeFuture.wait()
```


## Category: resource exhaustion

### Configure HTTP and WebSocket Limits to Prevent Resource Exhaustion

**Use when**

When setting up HTTP or WebSocket servers and decoders in SwiftNIO to process untrusted network payloads.

**Secure rules**

**Rule 1: Enforce explicit limits on HTTP header sizes, list sizes, and field counts using NIOHTTPDecoderLimitConfiguration.**

Pass a configured NIOHTTPDecoderLimitConfiguration instance when initializing HTTP decoders or adding HTTP handlers to a channel pipeline to prevent malicious clients from exhausting memory and CPU resources through massive or fragmented headers.

```swift
let limits = NIOHTTPDecoderLimitConfiguration(
    maxHeaderFieldSize: 8192,
    maxHeaderListSize: 81920,
    maxHeaderFieldCount: 100
)
let decoder = ByteToMessageHandler(HTTPRequestDecoder(leftOverBytesStrategy: .dropBytes, limits: limits))
```

**Rule 2: Configure explicit maximum frame sizes for WebSocket servers and frame decoders.**

Provide an appropriate `maxFrameSize` limit when initializing `NIOWebSocketServerUpgrader`, `NIOTypedWebSocketServerUpgrader`, or `WebSocketFrameDecoder` rather than accepting unbounded frame sizes, which prevents remote peers from triggering massive buffer memory allocations.

```swift
let upgrader = NIOWebSocketServerUpgrader(
    maxFrameSize: 64 * 1024,
    shouldUpgrade: { channel, reqHead in
        channel.eventLoop.makeSucceededFuture(HTTPHeaders())
    },
    upgradePipelineHandler: { channel, reqHead in
        channel.eventLoop.makeSucceededFuture(())
    }
)
```


### Enforce Strict Size Limits When Reading Files and Streams

**Use when**

When reading files, streams, or asynchronous sequences into memory to prevent uncontrolled memory consumption.

**Secure rules**

**Rule 1: Specify a maximum size limit when reading files into memory using readToEnd(fromAbsoluteOffset:maximumSizeAllowed:).**

Always provide a strict `maximumSizeAllowed` limit instead of reading unbounded file contents into memory, or stream large files incrementally using `readChunks()` to avoid out-of-memory errors.

```swift
let safeLimit = ByteCount.mebibytes(10)
let buffer = try await handle.readToEnd(maximumSizeAllowed: safeLimit)

for try await chunk in handle.readChunks(chunkLength: .kibibytes(128)) {
    // Process chunk incrementally
}
```

**Rule 2: Enforce explicit byte count limits when collecting asynchronous sequences into ByteBuffers.**

Pass a strict `maxBytes` argument when calling `collect(upTo:)` on an asynchronous sequence, and explicitly catch `NIOTooManyBytesError` to reject oversized network payloads.

```swift
do {
    let buffer = try await stream.collect(upTo: 1024 * 1024)
} catch is NIOTooManyBytesError {
    // Reject payload exceeding maximum size limit
}
```


## Category: runtime environment hardening

### Enable Close-On-Exec for File Descriptors in Subprocess Environments

**Use when**

Configuring runtime file descriptors and open options when the application executes subprocesses to prevent handle leaks.

**Secure rules**

**Rule 1: Set closeOnExec to true when opening file descriptors to restrict resource inheritance in child processes.**

Configure `OpenOptions` instances by explicitly setting `closeOnExec: true` for read, directory, and write operations. This prevents sensitive socket handles and open file descriptors from leaking across `execve` subprocess boundaries.

```swift
let readOptions = OpenOptions.Read(
    followSymbolicLinks: true,
    closeOnExec: true
)

let dirOptions = OpenOptions.Directory(
    followSymbolicLinks: false,
    closeOnExec: true
)
```
