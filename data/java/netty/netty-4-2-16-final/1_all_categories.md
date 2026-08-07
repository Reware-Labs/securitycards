# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`

## Category: access control

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


## Category: api contract misuse

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


## Category: authentication

### Validate Client Certificates for QUIC Server Connections

**Use when**

Configuring mutual TLS (mTLS) authentication for QUIC servers in Netty to ensure connecting clients are properly authenticated.

**Secure rules**

**Rule 1: Require mutual TLS client authentication explicitly on QUIC server contexts.**

Set `clientAuth(ClientAuth.REQUIRE)` and provide trusted certificates via `trustManager(...)` when building server contexts to prevent unauthenticated client access.

```java
QuicSslContext sslContext = QuicSslContextBuilder.forServer(keyFile, keyPassword, certFile)
    .trustManager(trustCertFile)
    .clientAuth(ClientAuth.REQUIRE)
    .build();
```


## Category: cryptography

### Configure Secure TLS Protocols, Cipher Suites, and Endpoint Verification

**Use when**

Configuring `SslContext` and client connections for Netty secure communications.

**Secure rules**

**Rule 1: Enable TLS hostname verification and configure strong protocols and cipher suites.**

Keep TLS endpoint verification enabled for client connections and avoid setting `io.netty.handler.ssl.defaultEndpointVerificationAlgorithm` to `NONE`. Explicitly restrict SSL/TLS contexts to secure protocols such as TLSv1.2 and TLSv1.3 and strong, authenticated cipher suites when building `SslContext` instances.

```java
SslContext sslCtx = SslContextBuilder.forClient()
    .protocols("TLSv1.2", "TLSv1.3")
    .ciphers(Arrays.asList("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", "TLS_AES_128_GCM_SHA256"))
    .build();
ChannelPipeline pipeline = ch.pipeline();
pipeline.addLast("ssl", sslCtx.newHandler(ch.alloc(), host, port));
```


## Category: dangerous execution

### Secure Dynamic Class Resolution and Native Library Loading

**Use when**

Configuring class resolution for dynamic loading or setting up native library working directories in Netty applications.

**Secure rules**

**Rule 1: Allowlist classes when using Netty Java deserialization**

Avoid Netty’s deprecated Java-serialization codecs where possible. When they must be used, configure a `jdk.serialFilter` allowlist that permits only the classes expected by the application before accepting serialized objects. Supplying a particular `ClassLoader` to a `ClassResolver` does not replace deserialization filtering.

**Rule 2: Configure a secure native working directory for dynamic JNI library extraction**

When Netty dynamically extracts and loads JNI dynamic libraries, configure the native working directory using `io.netty.native.workdir` to point to a secure location accessible only by the application execution context. Avoid defaulting to world-writable temporary directories where local users could tamper with binaries prior to dynamic loading.

```java
System.setProperty("io.netty.native.workdir", "/var/run/app/private_native_libs");
NativeLibraryLoader.loadFirstAvailable(loader, "netty_transport_native_epoll");
```

**Rule 3: Retain automatic deletion of extracted native libraries after loading**

Leave `io.netty.native.deleteLibAfterLoading` unset or set it to `true`. Netty enables this behavior by default, deletes an extracted native-library file after loading to free resources, and schedules deletion at JVM exit when immediate deletion is disabled or unsuccessful.

```shell
java -Dio.netty.native.deleteLibAfterLoading=true -jar application.jar
```


## Category: deserialization

### Enforce Strict Size Limits During Object Unmarshalling

**Use when**

When configuring decoders like `CompatibleMarshallingDecoder` to unmarshal network byte streams into Java objects.

**Secure rules**

**Rule 1: Configure an explicit maximum object size limit when unmarshalling untrusted byte streams to prevent memory exhaustion.**

When using `CompatibleMarshallingDecoder`, avoid using `Integer.MAX_VALUE` or unlimited sizes for object unmarshalling. Supply a strict byte size limit to `CompatibleMarshallingDecoder` to ensure that payload boundaries are validated before binding input bytes into Java object graphs.

```java
int maxObjectSize = 1024 * 1024;
ChannelHandler decoder = new CompatibleMarshallingDecoder(
    new DefaultUnmarshallerProvider(marshallerFactory, marshallingConfig),
    maxObjectSize
);
pipeline.addLast(decoder);
```


### Secure Object Deserialization and Enforce Payload Bounds

**Use when**

Configuring Netty serialization decoders such as `ObjectDecoder` and `ObjectDecoderInputStream` to process Java object streams from untrusted network sources.

**Secure rules**

**Rule 1: Enforce JVM-level serialization filters and custom allowlists to restrict deserialized classes.**

When using `ObjectDecoder`, `ObjectDecoderInputStream`, or `ClassResolvers`, avoid unrestricted object deserialization. Configure JVM-level serialization filters via the `jdk.serialFilter` system property or supply a custom `ClassResolver` to explicitly allowlist expected safe classes and prevent remote code execution through gadget chains.

```java
Set<String> ALLOWED_CLASSES = Set.of("com.example.MyDataDTO");
ClassResolver safeResolver = className -> {
    if (!ALLOWED_CLASSES.contains(className)) {
        throw new ClassNotFoundException("Class deserialization restricted: " + className);
    }
    return Class.forName(className);
};
CompactObjectInputStream in = new CompactObjectInputStream(inputStream, safeResolver);
```

**Rule 2: Configure explicit maximum object size limits on decoders to prevent memory exhaustion.**

Always provide an explicit `maxObjectSize` parameter when instantiating `ObjectDecoder` or `ObjectDecoderInputStream` to constrain incoming object frame lengths and stop oversized payloads from triggering `OutOfMemoryError` exceptions.

```java
int maxObjectSize = 1048576; // 1 MB limit
pipeline.addLast(new ObjectDecoder(maxObjectSize, ClassResolvers.weakCachingConcurrentResolver(getClass().getClassLoader())));
```


## Category: escape hatch

### Secure Internal Reflection and Dynamic Class Loading

**Use when**

Use when performing reflective access to internal classes, constructors, or fields, or when dynamically loading providers via reflection.

**Secure rules**

**Rule 1: Guard reflective lookups and field accessibility changes inside controlled privileged blocks and catch access or reflection exceptions.**

When using reflection to access non-public members, internal constructors, or system classes, wrap operations in controlled blocks and catch exceptions like `NoSuchMethodException` or `IllegalAccessException` to prevent fatal runtime failures.

```java
Object result = AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
    try {
        Field field = TargetClass.getDeclaredField("privateField");
        Throwable cause = ReflectionUtil.trySetAccessible(field, false);
        if (cause != null) {
            return cause;
        }
        return field.get(targetInstance);
    } catch (NoSuchFieldException | IllegalAccessException | SecurityException e) {
        return e;
    }
});
```

**Rule 2: Restrict dynamic reflection to hardcoded fully qualified class names.**

When using reflection to dynamically load and instantiate security providers or engine classes, restrict class lookup exclusively to hardcoded, fully-qualified internal constants. Do not pass untrusted or externally controlled class names.

```java
private static final String BC_PROVIDER = "org.bouncycastle.jce.provider.BouncyCastleProvider";

Class<Provider> bcProviderClass = (Class<Provider>) Class.forName(BC_PROVIDER, true, classLoader);
Provider provider = bcProviderClass.getConstructor().newInstance();
```


## Category: file handling

### Secure Multipart Upload Storage and Temporary File Lifecycle Management

**Use when**

Handling incoming HTTP multipart form uploads, file uploads, and temporary attributes in Netty.

**Secure rules**

**Rule 1: Configure isolated base directories for HTTP file uploads**

Use `DefaultHttpDataFactory.setBaseDir` or configure `DiskFileUpload.baseDirectory` and `DiskAttribute.baseDirectory` to point to dedicated directories protected by appropriate operating system access controls instead of relying on default system-wide temporary directories.

```java
DefaultHttpDataFactory factory = new DefaultHttpDataFactory(DefaultHttpDataFactory.MINSIZE);
factory.setBaseDir("/var/app/data/secure_tmp");
```

**Rule 2: Clean up multipart temporary disk files after processing requests**

Explicitly call cleanup methods such as `cleanRequestHttpData`, `cleanAllHttpData`, `decoder.destroy()`, or `decoder.cleanFiles()` in a `try-finally` block after completing multipart HTTP request processing to ensure temporary disk files and buffers are immediately deleted.

```java
HttpPostMultipartRequestDecoder decoder = new HttpPostMultipartRequestDecoder(factory, request);
try {
    // Process multipart request data
} finally {
    decoder.destroy();
}
```

**Rule 3: Sanitize destination paths and manage temporary file retention**

When persisting uploaded HTTP data using `HttpData.renameTo`, validate that target destination paths reside within expected directory boundaries and explicitly manage temporary file retention. Calling `renameTo` removes the file from the automatic factory cleaner, making explicit deletion imperative.

```java
Path basePath = Paths.get("/app/uploads").toAbsolutePath().normalize();
Path targetPath = basePath.resolve(filename).toAbsolutePath().normalize();
if (!targetPath.startsWith(basePath)) {
    httpData.delete();
    throw new IllegalArgumentException("Path traversal attempt detected");
}
try {
    if (!httpData.renameTo(targetPath.toFile())) {
        httpData.delete();
    }
} finally {
    httpData.delete();
}
```

**Rule 4: Enforce size limits on HTTP multipart file uploads**

Explicitly configure maximum size limits using `setMaxSize(long)` on Netty multipart `HttpData` instances to prevent excessive resource consumption and storage exhaustion.

```java
HttpData fileData = factory.createFileUpload(request, name, filename, contentType, contentTransferEncoding, charset, size);
fileData.setMaxSize(MAX_ALLOWED_FILE_BYTES);
try {
    fileData.addContent(chunkBuffer, isLast);
} catch (IOException e) {
    fileData.delete();
}
```


### Validate Paths and Stream Static Files Securely

**Use when**

Mapping HTTP request URIs to disk files and streaming static files or large content in Netty servers.

**Secure rules**

**Rule 1: Validate request paths before opening or serving files**

Validate and decode request-derived paths before constructing or opening files. Reject invalid or unsafe paths before file access, and do not rely on the simplistic path checks in Netty's static-file example for production use.

**Rule 2: Manage file channels and zero copy transfers safely**

Select the appropriate transfer mechanism based on TLS configuration. Use `DefaultFileRegion` for zero-copy file transfer over plain connections, and use `ChunkedFile` wrapped in `HttpChunkedInput` when SSL/TLS is active so that `SslHandler` can encrypt the outbound payload.

```java
RandomAccessFile raf = new RandomAccessFile(file, "r");
long fileLength = raf.length();
if (ctx.pipeline().get(SslHandler.class) == null) {
    ctx.write(new DefaultFileRegion(raf.getChannel(), 0, fileLength));
    ctx.writeAndFlush(LastHttpContent.EMPTY_LAST_CONTENT);
} else {
    ctx.writeAndFlush(new HttpChunkedInput(new ChunkedFile(raf, 0, fileLength, 8192)));
}
```

**Rule 3: Stream large static files using chunked input handlers**

Open underlying files in read-only mode and pass the `RandomAccessFile` to `ChunkedFile` inside chunked input wrappers to stream file content asynchronously in fixed-size chunks rather than loading entire files into memory.

```java
RandomAccessFile raf = new RandomAccessFile(file, "r");
long fileLength = raf.length();
Http2DataChunkedInput chunkedInput = new Http2DataChunkedInput(
    new ChunkedFile(raf, 0, fileLength, 8192), stream);
ctx.writeAndFlush(chunkedInput, ctx.newProgressivePromise());
```


## Category: input interpretation safety

### Enforce Strict Input Size Bounds and Protocol Parsing Limits

**Use when**

Configuring network protocol decoders, HTTP codecs, and frame decoders to ingest untrusted data safely.

**Secure rules**

**Rule 1: Configure explicit size bounds and header limits on inbound protocol decoders.**

Use configuration classes like `HttpDecoderConfig` with explicit bounds such as `setMaxInitialLineLength`, `setMaxHeaderSize`, and `setMaxChunkSize`, or pass explicit limits into protocol decoders like `StompSubframeDecoder`, `MqttDecoder`, and `LengthFieldBasedFrameDecoder` to reject oversized or malformed payloads before downstream processing.

```java
HttpDecoderConfig config = new HttpDecoderConfig()
    .setInitialBufferSize(1024)
    .setMaxInitialLineLength(4096)
    .setMaxHeaderSize(8192)
    .setMaxChunkSize(8192);
HttpRequestDecoder decoder = new HttpRequestDecoder(config);
```

**Rule 2: Enforce strict header validation, canonicalization, and parsing checks.**

Ensure decoders maintain strict validation defaults, such as enabling `setValidateHeaders(true)`, rejecting duplicate content lengths via `setAllowDuplicateContentLengths(false)`, enabling strict line parsing, and restricting UTF-8 string validation to reject malformed sequences, null characters, and injection vectors.

```java
HttpDecoderConfig config = new HttpDecoderConfig()
    .setValidateHeaders(true)
    .setAllowDuplicateContentLengths(false)
    .setStrictLineParsing(true)
    .setUseRfc9112TransferEncoding(true);
```

**Rule 3: Validate buffer read indexes and handle decoder errors securely.**

Verify that input buffers contain sufficient readable bytes before parsing frames, handle null return values for truncated packets, check decoder result flags like `decoderResult().isFailure()` or frame invalidity flags, and catch decoding exceptions to terminate sessions securely.

```java
public class FrameDecoder extends ByteToMessageDecoder {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) {
        if (in.readableBytes() < 4) {
            return;
        }
        int length = in.getInt(in.readerIndex());
        if (in.readableBytes() < 4 + length) {
            return;
        }
        in.skipBytes(4);
        out.add(in.readRetainedSlice(length));
    }
}
```


### Validate and Normalize Request Targets and Paths During Routing and Deep Link Resolution

**Use when**

Handling inbound HTTP requests, converting protocol headers, or parsing deep link URIs for routing and parameter extraction.

**Secure rules**

**Rule 1: Inspect raw path components or sanitize decoded paths prior to route matching to prevent path ambiguity and traversal bypasses.**

When using `QueryStringDecoder`, remember that `decoder.path()` automatically decodes percent-encoded characters while `decoder.rawPath()` preserves the original encoding. Route matching logic should inspect raw paths or explicitly normalize decoded paths, accounting for matrix parameters and boundary tokens.

```java
QueryStringDecoder decoder = new QueryStringDecoder(request.uri());
String path = decoder.path();
int matrixIdx = path.indexOf(';');
if (matrixIdx != -1) {
    path = path.substring(0, matrixIdx);
}
Map<String, List<String>> queryParams = decoder.parameters();
```

**Rule 2: Strictly validate converted HTTP/2 pseudo-headers before passing target paths to downstream routing components.**

When converting HTTP/1.x requests to HTTP/2 headers using `HttpConversionUtil.toHttp2Headers`, enable header validation and verify that the resulting `:path` pseudo-header complies with expected origin-form routing constraints to prevent routing mismatches across protocol translation layers.

```java
Http2Headers h2Headers = HttpConversionUtil.toHttp2Headers(httpRequest, true);
CharSequence rawPath = h2Headers.path();
if (rawPath == null || rawPath.length() == 0 || rawPath.charAt(0) != '/') {
    throw new IllegalArgumentException("Invalid or unsupportable routing target: " + rawPath);
}
```


## Category: memory safety

### Safely Manage Reference-Counted OpenSSL Contexts and Engines

**Use when**

Managing the lifecycle of Netty's `ReferenceCountedOpenSslContext` and `ReferenceCountedOpenSslEngine` native resources.

**Secure rules**

**Rule 1: Ensure OpenSSL engines are released before releasing their parent OpenSSL context to prevent native use-after-free access.**

Explicitly manage the lifecycle of `ReferenceCountedOpenSslEngine` instances by invoking `release()` when they are no longer needed, ensuring all child engines are shut down and released prior to releasing the parent `ReferenceCountedOpenSslContext`.

```java
ReferenceCountedOpenSslEngine engine = (ReferenceCountedOpenSslEngine) sslContext.newEngine(alloc);
try {
    // Conduct SSL communication
} finally {
    // Always release the engine before context release
    engine.release();
}
```


## Category: network boundary

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


## Category: output encoding

### Validate HTTP Header Values and Control Characters in Netty Codecs

**Use when**

Use when constructing HTTP/2 headers or translating HTTP/1.x objects to HTTP/2 frames to prevent header injection and control character smuggling.

**Secure rules**

**Rule 1: Enable value validation when constructing HTTP/2 headers from untrusted values**

When adding untrusted values to `DefaultHttp2Headers`, use the three-argument constructor with both header-name and header-value validation enabled. The second boolean enables rejection of prohibited characters such as NUL, CR, LF, DEL, and other control characters.

```java
Http2Headers headers = new DefaultHttp2Headers(true, true, 16);
headers.add("x-custom-header", userProvidedValue);
```

**Rule 2: Enable validateHeaders during outbound conversion from HTTP/1.x objects to HTTP/2 frames.**

Pass `validateHeaders` as true when instantiating `HttpToHttp2ConnectionHandler` so that `HttpConversionUtil.toHttp2Headers` checks header names, values, and control characters, blocking improper header content from being emitted in outbound traffic.

```java
HttpToHttp2ConnectionHandler handler = new HttpToHttp2ConnectionHandler(
    decoder,
    encoder,
    initialSettings,
    true /* validateHeaders */
);
```


## Category: resource exhaustion

### Configure Connection Idle Timeouts and Certificate Limits to Prevent Resource Exhaustion

**Use when**

Setting up Netty network services, QUIC servers, or SSL contexts where malicious clients could trigger resource exhaustion or memory denial-of-service.

**Secure rules**

**Rule 1: Enforce maximum peer certificate chain size limits on OpenSSL-backed SSL contexts.**

When configuring Netty's OpenSSL-backed SSL context, enforce limits on the maximum accepted peer certificate chain size by setting `OpenSslContextOption.MAX_CERTIFICATE_LIST_BYTES` on `SslContextBuilder` to prevent excessive memory allocation during TLS handshakes.

```java
SslContext sslCtx = SslContextBuilder.forServer(certFile, keyFile)
    .sslProvider(SslProvider.OPENSSL)
    .option(OpenSslContextOption.MAX_CERTIFICATE_LIST_BYTES, 64 * 1024)
    .build();
```

**Rule 2: Configure maximum idle timeouts on QUIC server and client builders.**

Explicitly configure a maximum idle timeout on `QuicServerBuilder` and `QuicClientBuilder` instances using `maxIdleTimeout()` to ensure abandoned connections are properly cleaned up and do not remain allocated in memory indefinitely.

```java
QuicServerBuilder serverBuilder = QuicServerBuilder.forServer(key, certificate)
    .maxIdleTimeout(30, TimeUnit.SECONDS);
```


## Category: runtime environment hardening

### Configure Platform Permissions, Privileged Blocks, and Runtime Hardening for Netty Components

**Use when**

Configuring Netty applications in environments enforcing Java SecurityManager restrictions, modular encapsulation, or custom platform permissions.

**Secure rules**

**Rule 1: Execute restricted network socket initialization conditionally under `AccessController.doPrivileged` after verifying security manager presence.**

Check whether `System.getSecurityManager() != null` before wrapping socket operations inside `AccessController.doPrivileged` to prevent unnecessary allocations and avoid capability exceptions.

```java
if (System.getSecurityManager() != null) {
    try {
        ServerSocketChannel ssc = AccessController.doPrivileged(
            new PrivilegedExceptionAction<ServerSocketChannel>() {
                @Override
                public ServerSocketChannel run() throws Exception {
                    ServerSocketChannel channel = ServerSocketChannel.open();
                    channel.socket().bind(null);
                    channel.configureBlocking(false);
                    return channel;
                }
            });
    } catch (PrivilegedActionException e) {
        throw (IOException) e.getCause();
    }
} else {
    ServerSocketChannel channel = ServerSocketChannel.open();
    channel.socket().bind(null);
    channel.configureBlocking(false);
}
```

**Rule 2: Bind worker threads explicitly to a designated `ThreadGroup` using `DefaultThreadFactory`.**

Pass an explicit `ThreadGroup` parameter when instantiating `DefaultThreadFactory` to enforce distinct execution boundaries instead of inheriting the caller thread group dynamically.

```java
ThreadGroup isolatedGroup = new ThreadGroup("isolated-workers");
DefaultThreadFactory factory = new DefaultThreadFactory(
    "worker-pool",
    false,
    Thread.NORM_PRIORITY,
    isolatedGroup
);
Thread worker = factory.newThread(task);
```

**Rule 3: Disable Netty Unsafe capability probes in restricted sandbox runtime environments.**

Set the JVM system property `-Dio.netty.noUnsafe=true` when launching applications in secure environments to prevent dynamic acquisition of `sun.misc.Unsafe` capabilities.

```bash
java -Dio.netty.noUnsafe=true -jar my-netty-application.jar
```

**Rule 4: Restrict native library extraction work directory permissions to a private, secure path.**

Configure the `io.netty.native.workdir` system property to point to a dedicated, process-private directory with restricted filesystem permissions and native execution support.

```bash
java -Dio.netty.native.workdir=/var/run/app/netty-native -jar myapp.jar
```


## Category: secret handling

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


## Category: session management

### Configure Explicit SSL Session Cache Limits and Timeouts

**Use when**

When instantiating server SSL contexts and setting explicit upper bounds for session cache size and timeouts to prevent unbounded memory consumption from cached TLS sessions.

**Secure rules**

**Rule 1: Set explicit non-zero upper bounds for sessionCacheSize and sessionTimeout on the server SSL session context.**

When instantiating server SSL contexts using `SslContextBuilder`, configure `sessionCacheSize` and `sessionTimeout` with explicit values to prevent unbounded memory consumption from cached TLS sessions.

```java
SslContext sslContext = SslContextBuilder.forServer(keyCertChainFile, keyFile)
    .sslProvider(SslProvider.JDK)
    .sessionCacheSize(10000)
    .sessionTimeout(3600)
    .build();
```
