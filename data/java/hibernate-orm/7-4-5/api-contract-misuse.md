# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: api contract misuse

## api contract misuse

### Ensure Pessimistic Locks Cover All Targeted Entities in HQL Projections

**Use when**

When executing HQL queries with pessimistic locking to protect against concurrent modifications and race conditions.

**Secure rules**

**Rule 1: Apply pessimistic write locks to queries that retrieve entities requiring exclusive access**

When concurrent transactions might update the same entity, execute an entity-valued query with `LockModeType.PESSIMISTIC_WRITE` to request an explicit database lock.

```java
List<Book> books = session.createQuery(
        "select b from Book b where b.id = :id", Book.class)
    .setParameter("id", bookId)
    .setLockMode(LockModeType.PESSIMISTIC_WRITE)
    .getResultList();
```
