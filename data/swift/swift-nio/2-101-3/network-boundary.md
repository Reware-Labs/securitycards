# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: network boundary

## network boundary

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
