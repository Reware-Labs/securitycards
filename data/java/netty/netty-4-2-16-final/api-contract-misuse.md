# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: api contract misuse

## api contract misuse

### Sanitize Pipeline Exceptions and Avoid Exposing Raw Error Details

**Use when**

Developing or maintaining channel handlers in Netty pipelines that process inbound and outbound events and handle uncaught exceptions.

**Secure rules**

**Rule 1: Handle pipeline exceptions and close failed channels in `exceptionCaught`**

Override `exceptionCaught` when a handler must terminate a connection after an exception. Record the exception for diagnosis and call `ctx.close()` to close the affected channel.

```java
@Override
public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
    cause.printStackTrace();
    ctx.close();
}
```

**Rule 2: Handle or explicitly propagate exceptions in `exceptionCaught`**

When overriding `exceptionCaught`, either handle the failure and close the affected channel or forward the exception to the next pipeline handler with `ctx.fireExceptionCaught(cause)`. Do not silently discard the exception.

```java
@Override
public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
    logger.error("An unexpected pipeline exception occurred", cause);
    ctx.close();
}
```


### Use SslContextBuilder for Secure SSL Context Initialization

**Use when**

Building TLS server or client SSL contexts in Netty applications and avoiding deprecated factory methods or direct constructor instantiation.

**Secure rules**

**Rule 1: Construct SSL contexts using `SslContextBuilder` rather than deprecated static factory methods or direct constructor calls.**

Use `SslContextBuilder` to configure server and client contexts correctly, providing required options and avoiding legacy factory methods and direct constructors like `JdkSslServerContext` that lack centralized parameter validation and proper security defaults.

```java
SslContext serverCtx = SslContextBuilder.forServer(certChainFile, keyFile, keyPassword).build();
SslContext clientCtx = SslContextBuilder.forClient().trustManager(trustManagerFactory).build();
```
