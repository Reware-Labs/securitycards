# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Protocol and Content-Type Validation in SSE and WebSocket Sessions

**Use when**

Developing client applications using Ktor HTTP, SSE, or WebSocket engines where protocol framing, content types, and connection state must be strictly enforced.

**Secure rules**

**Rule 1: Validate that server responses enforce expected HTTP status codes and content types when establishing server-sent events streams.**

Catch `SSEClientException` when initializing SSE sessions to handle invalid content types or non-200 responses properly rather than parsing incorrect payloads.

```kotlin
val client = HttpClient {
    install(SSE)
}

try {
    client.sse("https://api.example.com/events") {
        incoming.collect { event ->
            // Process valid SSE events safely
        }
    }
} catch (e: SSEClientException) {
    logger.error("SSE stream connection failed: ${e.message}", e)
}
```

**Rule 2: Avoid sending reserved WebSocket close codes over network boundaries.**

Do not transmit reserved RFC 6455 close codes such as 1006 during WebSocket session closure to maintain specification compliance.

```kotlin
client.webSocket("ws://localhost/ws") {
    outgoing.send(Frame.Close(CloseReason(CloseReason.Codes.NORMAL, "User logged out")))
}
```
