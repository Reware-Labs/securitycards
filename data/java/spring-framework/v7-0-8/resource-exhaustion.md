# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: resource exhaustion

## resource exhaustion

### Enforce Strict Size And Collection Limits To Prevent Resource Exhaustion

**Use when**

When bounding input parameters, data binders, database query collection parameters, and streaming decoders to prevent excessive memory or connection consumption.

**Secure rules**

**Rule 1: Enforce safe upper limits on collection auto-growing during data binding.**

Configure `setAutoGrowCollectionLimit` on your `DataBinder` instance to a safe lower bound based on application requirements, preventing excessive memory allocations and `OutOfMemoryError` when binding out-of-bounds collection indices.

```java
DataBinder binder = new DataBinder(target);
binder.setAutoGrowCollectionLimit(50);
```

**Rule 2: Validate and cap collection sizes bound to named parameters in SQL queries**

Check and cap the size of input collections before executing queries with collection parameter expansion to bound generated SQL and bind-marker growth.

```java
List<String> userIds = getUserIdsFromRequest();
if (userIds.size() > 100) {
    throw new IllegalArgumentException("Requested user count exceeds maximum batch limit of 100");
}

databaseClient.sql("SELECT * FROM users WHERE id IN (:ids)")
    .bind("ids", userIds)
    .fetch()
    .all();
```

**Rule 3: Configure positive memory buffer limits when tokenizing reactive JSON streams.**

Always configure an explicit non-negative `maxInMemorySize` limit when tokenizing reactive JSON streaming byte buffers to protect server heap memory from unbounded accumulation.

```java
int maxInMemorySize = 256 * 1024;
Flux<TokenBuffer> tokens = Jackson2Tokenizer.tokenize(
    dataBufferFlux,
    jsonFactory,
    objectMapper,
    tokenizeArrays,
    forceUseOfBigDecimal,
    maxInMemorySize
);
```

**Rule 4: Configure explicit WebSocket frame payload limits to prevent buffer exhaustion.**

Explicitly configure maximum frame payload limits on WebSocket client specs or engine containers to prevent remote peers from consuming disproportionate memory resources.

```java
ReactorNettyWebSocketClient nettyClient = new ReactorNettyWebSocketClient(
    httpClient,
    () -> WebsocketClientSpec.builder().maxFramePayloadLength(65536)
);
```
