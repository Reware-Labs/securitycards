# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: api contract misuse

## api contract misuse

### Supply Matching Delegates When Configuring Custom NSURLSession in Darwin Engine

**Use when**

Configuring a custom `NSURLSession` for the Ktor Darwin client engine using `DarwinClientEngineConfig.usePreconfiguredSession`.

**Secure rules**

**Rule 1: Always supply both the custom `NSURLSession` and its matching `KtorNSURLSessionDelegate` instance to prevent initialization exceptions and broken request handling.**

When configuring a custom `NSURLSession` using `DarwinClientEngineConfig.usePreconfiguredSession`, you must provide the session along with its corresponding `KtorNSURLSessionDelegate` instance. Passing a session without its matching delegate causes an `IllegalArgumentException` at initialization and disrupts Ktor's internal pipeline and delegation mechanism for network events and authentication challenges.

```kotlin
val delegate = KtorNSURLSessionDelegate()
val session = NSURLSession.sessionWithConfiguration(
    NSURLSessionConfiguration.defaultSessionConfiguration(),
    delegate,
    delegateQueue = NSOperationQueue()
)

val client = HttpClient(Darwin) {
    engine {
        usePreconfiguredSession(session, delegate)
    }
}
```
