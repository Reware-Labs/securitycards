# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: secret handling

## secret handling

### Disable TLS Keylogging to Prevent Secret Disclosure

**Use when**

Configuring QUIC SSL contexts in non-development environments to prevent dumping session secrets.

**Secure rules**

**Rule 1: Disable TLS keylogging by setting keylog to false on the SSL context builder.**

Explicitly disable keylogging using `QuicSslContextBuilder.keylog(false)` to prevent symmetric encryption keys from being written to system logs.

```java
QuicSslContext sslContext = QuicSslContextBuilder.forClient()
    .trustManager(InsecureTrustManagerFactory.INSTANCE)
    .applicationProtocols(QuicTestUtils.PROTOS)
    .keylog(false)
    .build();
```


### Sanitize Logging and Telemetry Hints to Prevent Sensitive Data Disclosure

**Use when**

Configuring network channel logging or resource leak tracking mechanisms that process user payloads or telemetry.

**Secure rules**

**Rule 1: Configure LoggingHandler with ByteBufFormat.SIMPLE to prevent raw payload leakage.**

Use `ByteBufFormat.SIMPLE` when instantiating `LoggingHandler` in environments processing sensitive network data to ensure only byte sizes rather than full hex dumps of payload contents are written to log files.

```java
LoggingHandler handler = new LoggingHandler(LogLevel.INFO, ByteBufFormat.SIMPLE);
channel.pipeline().addLast(handler);
```
