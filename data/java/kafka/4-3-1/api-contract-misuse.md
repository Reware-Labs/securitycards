# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: api contract misuse

## api contract misuse

### Differentiate Retriable and Non-Retriable Errors in Retry and Error Handling Workflows

**Use when**

Implementing retry logic, custom exception handlers, or error management across Kafka clients, admin operations, and producers to handle transient network issues without masking fatal security or state errors.

**Secure rules**

**Rule 1: Distinguish between retriable broker errors and non-retriable authentication, authorization, or state exceptions before retrying operations.**

Inspect underlying error causes and exception types to ensure that transient connection or cluster errors are retried according to configured limits, while fatal security exceptions such as `AuthorizationException` or `AuthenticationException` fail fast without triggering manual retry loops or resource exhaustion.

```java
try {
    admin.createTopics(Collections.singleton(new NewTopic("topic", 1, (short) 1))).all().get();
} catch (ExecutionException e) {
    if (e.getCause() instanceof AuthorizationException || e.getCause() instanceof AuthenticationException) {
        throw e;
    }
}
```

**Rule 2: Validate exception retriability within custom exception handlers before returning retry responses.**

Ensure that custom exception handlers like `ProductionExceptionHandler` verify that an exception instance implements `org.apache.kafka.common.errors.RetriableException` before returning `Response.retry()`, preventing non-retriable errors from being mishandled as retriable and bypassing proper failure handling.

```java
@Override
public Response handleError(ErrorHandlerContext context, ProducerRecord<byte[], byte[]> record, Exception exception) {
    if (exception instanceof org.apache.kafka.common.errors.RetriableException) {
        return Response.retry();
    }
    return Response.fail();
}
```

**Rule 3: Restrict transactional retry handling to transient errors and immediately halt on fatal transaction states.**

Strictly separate transient retriable errors such as `CONCURRENT_TRANSACTIONS` from non-retriable fatal errors like `ProducerFencedException`, allowing safe backoff retries only for transient issues while transitioning fatal errors to an abortable or fatal state.

```java
if (error.isRetriable()) {
    transactionManager.retryRequest(request, retryBackoffMs);
} else if (error == Errors.PRODUCER_FENCED.exception()) {
    transactionManager.transitionToFatalError(error);
} else {
    transactionManager.transitionToAbortableError(error);
}
```


### Initialize ClientCredentialsJwtRetriever before token retrieval

**Use when**

Instantiating and using custom SASL/OAUTHBEARER token retriever logic in Kafka clients.

**Secure rules**

**Rule 1: Invoke configuration methods on ClientCredentialsJwtRetriever before calling token retrieval operations.**

Always invoke `configure()` on `ClientCredentialsJwtRetriever` before calling `retrieve()` or attempting token fetch operations to prevent an `IllegalStateException` caused by an uninitialized internal HTTP retriever delegate.

```java
ClientCredentialsJwtRetriever retriever = new ClientCredentialsJwtRetriever();
retriever.configure(configs, saslMechanism, jaasConfigEntries);
String jwtToken = retriever.retrieve();
retriever.close();
```
