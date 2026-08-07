# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: access control

## access control

### Secure Channel Authorization and Proxy Connection Handling

**Use when**

Implementing custom Netty `ChannelHandler` authorization logic or managing outbound proxy connections via `HttpProxyHandler` or `Socks5ProxyHandler`.

**Secure rules**

**Rule 1: Fail securely upon receiving proxy connection authorization rejections.**

When routing network traffic through proxy handlers, inspect connection futures for `ProxyConnectException` to catch HTTP 403 or SOCKS FORBIDDEN statuses. Reject the connection securely and do not attempt unsafe fallbacks to unproxied access.

```java
bootstrap.connect(destinationAddress).addListener((ChannelFuture future) -> {
    if (!future.isSuccess()) {
        Throwable cause = future.cause();
        if (cause instanceof ProxyConnectException) {
            logger.error("Proxy connection authorization denied: {}", cause.getMessage());
        }
    }
});
```

**Rule 2: Isolate authorization state per channel in shared channel handlers.**

When implementing authorization checks inside custom `ChannelHandler` implementations, ensure stateful authorization flags are scoped to individual connections. When sharing a handler instance marked with `@Sharable`, store authorization state exclusively via `ChannelHandlerContext` attributes using `AttributeKey`.

```java
@Sharable
public class AuthorizedDataHandler extends SimpleChannelInboundHandler<DataMessage> {
    private static final AttributeKey<Boolean> IS_AUTHORIZED = AttributeKey.valueOf("is_authorized");

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, DataMessage msg) {
        if (msg.isAuthToken()) {
            ctx.attr(IS_AUTHORIZED).set(verifyPermissions(msg.getToken()));
        } else {
            if (Boolean.TRUE.equals(ctx.attr(IS_AUTHORIZED).get())) {
                ctx.writeAndFlush(fetchData(msg));
            } else {
                throw new SecurityException("Unauthorized data access attempt");
            }
        }
    }
}
```
