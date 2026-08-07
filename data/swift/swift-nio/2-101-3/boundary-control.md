# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: boundary control

## boundary control

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
