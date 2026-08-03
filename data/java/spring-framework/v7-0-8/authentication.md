# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: authentication

## authentication

### Clear thread-bound JMS user credentials after use

**Use when**

When supplying per-request dynamic credentials using UserCredentialsConnectionFactoryAdapter for JMS connections.

**Secure rules**

**Rule 1: Always invoke removeCredentialsFromCurrentThread in a try-finally block when using setCredentialsForCurrentThread**

Failing to clean up ThreadLocal state in thread-pooled environments causes credentials to leak across operations, allowing subsequent tasks on the same thread to execute with incorrect user identities. Always call `removeCredentialsFromCurrentThread()` inside a `finally` block following connection creation.

```java
UserCredentialsConnectionFactoryAdapter adapter = new UserCredentialsConnectionFactoryAdapter();
adapter.setTargetConnectionFactory(targetConnectionFactory);

adapter.setCredentialsForCurrentThread(username, password);
try {
    Connection conn = adapter.createConnection();
    // Perform JMS operations
} finally {
    adapter.removeCredentialsFromCurrentThread();
}
```
