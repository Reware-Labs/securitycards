# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: interface protocol hardening

## interface protocol hardening

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
