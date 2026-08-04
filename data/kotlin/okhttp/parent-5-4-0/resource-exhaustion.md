# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: resource exhaustion

## resource exhaustion

### Configure Dispatcher Concurrency Limits and Read Timeouts

**Use when**

Configuring OkHttpClient instances to handle concurrent network traffic and prevent thread starvation or resource exhaustion.

**Secure rules**

**Rule 1: Configure explicit concurrency limits on the Dispatcher and read timeouts on the client to protect against request overloads and thread hangs.**

Set explicit maximum limits on total concurrent requests and per-host requests using the `Dispatcher` to prevent exhausting system memory, thread resources, and file descriptors. Additionally, define an explicit `readTimeout` on `OkHttpClient.Builder` to prevent execution threads from blocking indefinitely when handling servers that send inaccurate metadata or stall stream delivery.

```java
Dispatcher dispatcher = new Dispatcher();
dispatcher.setMaxRequests(32);
dispatcher.setMaxRequestsPerHost(4);

OkHttpClient client = new OkHttpClient.Builder()
    .dispatcher(dispatcher)
    .readTimeout(Duration.ofSeconds(10))
    .build();
```


### Stream Response Bodies Incrementally and Enforce Resource Limits

**Use when**

Handling large or continuous HTTP response bodies where loading entire payloads into heap memory risks exhaustion, or managing active streaming lifecycles.

**Secure rules**

**Rule 1: Avoid loading large response bodies entirely into memory via `ResponseBody.string()`**

When processing HTTP responses that may exceed 1 MiB, stream the response body incrementally using streaming APIs such as `ResponseBody.source()` or `ResponseBody.byteStream()` to prevent heap memory exhaustion and `OutOfMemoryError` crashes.

```kotlin
client.newCall(request).execute().use { response ->
  if (!response.isSuccessful) throw IOException("Unexpected code $response")
  val source = response.body!!.source()
  // Read from source incrementally rather than calling response.body!!.string()
}
```

**Rule 2: Explicitly manage active streaming lifecycles instead of relying on call timeouts**

Because call timeouts are enforced during initial connection setup and HTTP header retrieval rather than active streaming, developers must explicitly manage streaming lifecycles by calling `cancel()` on the `EventSource` or `Call` to prevent long-lived connections from consuming socket resources indefinitely.

```kotlin
val client = OkHttpClient.Builder()
  .readTimeout(30, TimeUnit.SECONDS)
  .build()

val request = Request.Builder()
  .url("https://example.com/stream")
  .build()

val eventSource = EventSources.createFactory(client)
  .newEventSource(request, listener)

eventSource.cancel()
```
