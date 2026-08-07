# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: input interpretation safety

## input interpretation safety

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
