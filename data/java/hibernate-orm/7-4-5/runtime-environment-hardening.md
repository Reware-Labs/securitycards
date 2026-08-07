# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: runtime environment hardening

## runtime environment hardening

### Disable SQL console logging in production environments

**Use when**

Configuring the persistence layer or runtime environment for production deployment.

**Secure rules**

**Rule 1: Disable SQL console output and logging in production configurations.**

Ensure SQL console output is disabled in production configurations by setting showSql to false in `showSql(showSql, formatSql, highlightSql)` to prevent leaking query structures and parameter context into unencrypted application logs.

```java
HibernatePersistenceConfiguration config = new HibernatePersistenceConfiguration("prod-pu")
    .showSql(false, false, false);
```
