# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: api contract misuse

## api contract misuse

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
