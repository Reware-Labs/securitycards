# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: resource exhaustion

## resource exhaustion

### Enforce Frame Size Limits on WebSockets and Bounded Redirections in Ktor Clients

**Use when**

Configuring Ktor client plugins such as `WebSockets` and `HttpRedirect` to handle remote network streams and untrusted server interactions safely.

**Secure rules**

**Rule 1: Configure explicit maximum frame sizes on WebSocket sessions to prevent memory exhaustion.**

When installing the `WebSockets` plugin in the Ktor client, set `maxFrameSize` to an appropriate threshold to prevent malicious or malfunctioning remote endpoints from sending oversized frames that consume excessive heap memory.

```kotlin
val client = HttpClient {
    install(WebSockets) {
        maxFrameSize = 1024 * 1024 // Set maximum frame size to 1MB
    }
}
```

**Rule 2: Bound automatic redirect loops in HTTP client configurations**

When automatic redirect handling is enabled (the default, or via the `HttpRedirect` plugin), bound the number of requests that may be sent during a single call—including those caused by redirects—by configuring `maxSendCount` on the always-installed `HttpSend` plugin. Exceeding the limit throws `SendCountExceedException` so that cyclic redirect responses fail fast rather than consuming memory and network resources indefinitely. The default value is 20.

```kotlin
val client = HttpClient {
    install(HttpSend) {
        maxSendCount = 20
    }
}
```

**Rule 3: Specify an explicit limit parameter when parsing raw query strings.**

When parsing raw query strings manually using `parseQueryString`, specify an explicit limit parameter to cap the maximum number of query key-value pairs processed and avoid high memory consumption.

```kotlin
val parameters = parseQueryString(rawQuery, startIndex = 0, limit = 100)
```
