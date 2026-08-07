# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: boundary control

## boundary control

### Restrict Persistence Contexts to Single Threads and Transactions

**Use when**

When initializing, injecting, or managing `EntityManager` or `Session` instances across multi-threaded application environments.

**Secure rules**

**Rule 1: Never share an instance of EntityManager or Session across multiple threads or concurrent transactions.**

Scope sessions strictly to individual requests or transactions, ensuring each thread creates and closes its own session or relies on container-managed lifecycle hooks. Each persistence context must be restricted to a single thread and unit of work to prevent data aliasing, race conditions, and broken transaction isolation.

```java
try (Session session = sessionFactory.openSession()) {
    sessionFactory.inTransaction(s -> {
        // Perform operations within isolation boundary
    });
}
```
