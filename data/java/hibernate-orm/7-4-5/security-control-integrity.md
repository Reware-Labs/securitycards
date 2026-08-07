# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: security control integrity

## security control integrity

### Configure Robust Migration Safety and Error Handling

**Use when**

Configuring, programmatically executing, or automating database schema migrations and validation actions to prevent inconsistent states or destructive changes.

**Secure rules**

**Rule 1: Halt application startup and migration execution immediately upon encountering DDL or schema validation errors.**

Enable `hibernate.hbm2ddl.halt_on_error` as `true` or configure programmatic tools with `setHaltOnError(true)` so that migration failures throw exceptions instead of leaving schemas partially updated.

```java
SchemaUpdate update = new SchemaUpdate();
update.setHaltOnError(true);
update.execute(EnumSet.of(TargetType.DATABASE), metadata);
if (!update.getExceptions().isEmpty()) {
    throw new IllegalStateException("Schema migration failed: " + update.getExceptions());
}
```

**Rule 2: Restrict automatic database schema updates in production to non-destructive actions.**

Avoid destructive actions such as `create`, `create-drop`, `drop`, or `truncate` in production. Set database actions to `validate` or `none` to prevent accidental loss of production data.

```properties
hibernate.hbm2ddl.auto=validate
jakarta.persistence.schema-generation.database.action=none
```


### Enable Session Filters and Validate Parameters Immediately upon Session Creation

**Use when**

Use when initializing database sessions that rely on security filters to enforce tenant isolation or access control restrictions.

**Secure rules**

**Rule 1: Enable security filters immediately after opening a session and validate their parameters to prevent data exposure bypass.**

Hibernate session filters are disabled by default for new sessions. You must explicitly enable the required filter right after session initialization and invoke the `validate()` method on the parameter assignments before executing any queries. This ensures access control restrictions and data isolation boundaries remain consistently applied and fail closed.

```java
sessionFactory.inTransaction(session -> {
    session.enableFilter("ByRegion")
        .setParameter("region", userRegion)
        .validate();
    // Execute queries securely under active filter
});
```
