# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: resource exhaustion

## resource exhaustion

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
