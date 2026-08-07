# Security blueprint

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`

## Security posture

Netty provides low-level asynchronous network primitives and protocol codecs that require developers to explicitly enforce strict input bounds, cryptographic verification, and resource management. The library protects transport mechanics and channel lifecycles by default, but does not sanitize application payloads, validate complex routing logic, or restrict dynamic deserialization without developer configuration. Security-sensitive surfaces include protocol decoders, channel pipelines, SSL contexts, and file handlers, all of which must fail closed when encountering malformed inputs, authorization rejections, or resource anomalies.

## Essential implementation rules

1. **Enforce Strict Inbound Protocol and Payload Bounds**

Configure explicit protocol limits using `HttpDecoderConfig` or length-field decoders with explicit bounds such as max initial line length, header size, and payload limits. Always verify buffer read indexes before parsing frames and reject oversized or malformed inputs before downstream processing.

2. **Secure Object Deserialization and Unmarshalling**

Avoid legacy Java serialization codecs. When unmarshalling untrusted data streams, enforce JVM-level `jdk.serialFilter` allowlists or custom `ClassResolvers` and provide strict byte-size limits on decoders like `CompatibleMarshallingDecoder` and `ObjectDecoder` to prevent remote code execution and memory exhaustion.

3. **Configure Robust Transport Security and Mutual TLS**

Construct server and client SSL contexts using `SslContextBuilder` with restricted secure protocols (TLSv1.2 and TLSv1.3) and strong cipher suites. Enable endpoint hostname verification and require mutual TLS explicitly via client authentication configuration on server and QUIC contexts.

4. **Isolate Authorization State and Handle Connection Rejections Securely**

Scope stateful authorization flags to individual connections using `AttributeKey` references within `@Sharable` channel handlers. Inspect proxy connection futures for authorization failures and ensure connections fail closed without attempting unsafe fallbacks.

5. **Sanitize Pipeline Exceptions and Logging Telemetry**

Override `exceptionCaught` in channel handlers to cleanly record failures and close affected channels or propagate exceptions explicitly without discarding them. Use `ByteBufFormat.SIMPLE` in `LoggingHandler` instances to prevent raw sensitive payload leakage in logs.

6. **Validate Paths and Manage Multipart File Upload Lifecycles**

Validate and normalize request paths and file names to prevent traversal bypasses before accessing disk resources or streaming files. Configure isolated base directories for HTTP uploads, set strict size limits on multipart data, and explicitly destroy decoders or delete temporary files in `try-finally` blocks.

7. **Harden Runtime Native Libraries and Platform Capabilities**

Configure `io.netty.native.workdir` to point to a process-private filesystem directory for JNI dynamic library extractions with permissions restricted to the application execution context. Set JVM properties such as `-Dio.netty.noUnsafe=true` when running in sandboxed security manager environments.

8. **Bind Local Boundaries and Enforce Resource Exhaustion Controls**

Bind local servers and datagram channels explicitly to loopback addresses like `127.0.0.1` instead of wildcard interfaces. Enforce peer certificate chain size limits, configure maximum idle timeouts on QUIC builders, and set explicit non-zero bounds for session cache sizes and timeouts.
