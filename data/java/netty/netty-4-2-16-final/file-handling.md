# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: file handling

## file handling

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
