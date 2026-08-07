# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: network boundary

## network boundary

### Secure Inter-Process and Inter-Component Network Boundaries and Peer Authentication

**Use when**

Developing local inter-process communication (IPC) channels, server sockets, or datagram connections using Netty transports that require strict interface isolation and peer validation.

**Secure rules**

**Rule 1: Explicitly bind local server and datagram channels to loopback addresses rather than wildcard interfaces.**

When configuring Netty `ServerBootstrap` or datagram channels for inter-process communication, avoid wildcard addresses like `0.0.0.0`. Bind explicitly to loopback addresses such as `127.0.0.1` or `NetUtil.LOCALHOST` to prevent exposing internal IPC channels to external network interfaces.

```java
InetSocketAddress localAddress = new InetSocketAddress("127.0.0.1", port);
ChannelFuture f = sb.bind(localAddress).sync();
```

**Rule 2: Authenticate local IPC peer processes on Unix domain datagram sockets.**

When performing inter-process communication via `EpollDomainDatagramChannel` over Unix domain sockets, authenticate peer processes by inspecting peer credentials retrieved through `peerCredentials()` before trusting incoming datagrams.

```java
PeerCredentials credentials = channel.peerCredentials();
if (credentials.uid() != EXPECTED_UID) {
    channel.close();
    throw new SecurityException("Unauthorized IPC peer UID: " + credentials.uid());
}
```

**Rule 3: Enforce QUIC address validation in production network services.**

When configuring HTTP/3 or QUIC server endpoints for inter-process or inter-component communication, avoid using `InsecureQuicTokenHandler.INSTANCE`, which skips address validation tokens and enables UDP amplification attacks. Always configure a validating `QuicTokenHandler` implementation for production deployments.

```java
ChannelHandler codec = Http3.newQuicServerCodecBuilder()
        .sslContext(quicSslContext)
        .tokenHandler(tokenHandler)
        .handler(new Http3HelloWorldServerInitializer())
        .build();
```
