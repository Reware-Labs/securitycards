# Security blueprint

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`

## Security posture

When developing applications with Hibernate-ORM, developers must assume responsibility for securing query construction, resource lifecycle limits, multi-tenant isolation, and credential management. While the framework manages object-relational mapping and connection lifecycles, it does not protect by default against unparameterized dynamic queries, insecure deserialization, unsafe DDL migrations, or hardcoded secrets. Security-sensitive surfaces include session factories, custom event listeners, SQL inspection hooks, and schema generation tools, all of which should fail closed when errors occur.

## Essential implementation rules

1. **Isolate Multi-Tenant Data and Enable Security Filters**

Explicitly specify the tenant identifier when opening multitenant sessions using `SessionFactory.withOptions().tenantIdentifier(tenantId).openSession()`. Additionally, enable security filters immediately after opening a session and validate their parameters before executing queries.

2. **Use Parameterized Queries and Apply Pessimistic Locks**

Bind untrusted values through query parameters using `setParameter` or `setParameterList` instead of concatenating query strings. For concurrent transactions requiring exclusive access, apply explicit pessimistic write locks via `LockModeType.PESSIMISTIC_WRITE`.

3. **Restrict Persistence Contexts to Single Threads**

Never share an instance of `EntityManager` or `Session` across multiple threads or concurrent transactions. Scope sessions strictly to individual requests or units of work to prevent data aliasing and race conditions.

4. **Validate Dynamic Listeners and Keep StatementInspectors Non-Mutating**

Register fixed event listener classes programmatically via an `Integrator` and `EventListenerRegistry` instead of accepting external class names. When utilizing a `StatementInspector` for auditing, ensure it returns `null` so Hibernate executes original SQL statements unchanged.

5. **Replace Binary Serialization with Safe Converters**

Avoid relying on default Java binary serialization fallback for basic attributes implementing `java.io.Serializable`. Instead, explicitly implement an `AttributeConverter` or custom `UserType` to serialize object state safely into standard text formats like JSON.

6. **Enforce Jakarta Bean Validation on Entities**

Apply standard Jakarta Validation annotations such as `NotNull`, `Size`, `Min`, `Max`, `Email`, and `NotEmpty` on entity attributes to validate input data before database persistence.

7. **Configure Production Connection Pools and Limits**

Explicitly configure a production-grade connection pool provider such as HikariCP, Agroal, or C3P0, and set strict pool bounds and login timeouts. Configure connection isolation and autocommit directly on external `DataSource` instances, and ensure the session factory is properly closed on application shutdown.

8. **Manage Memory and Resources During Large Operations**

Apply explicit pagination limits using `Query#setMaxResults()` and `Query#setFirstResult()`. During bulk batch operations, periodically call `session.flush()` and `session.clear()`, and wrap scrollable or streamed result sets in try-with-resources blocks.

9. **Disable SQL Console Logging in Production**

Ensure SQL console output is disabled in production configurations by setting `showSql` to false to prevent leaking query structures and parameter context into unencrypted application logs.

10. **Externalize Database Credentials**

Load database credentials dynamically at runtime using environment variables or external secret managers instead of embedding them in source code or configuration files.

11. **Enforce Migration Safety and Halt on Errors**

Halt application startup and migration execution immediately upon encountering DDL or schema validation errors by enabling `hibernate.hbm2ddl.halt_on_error`. Restrict automatic schema updates in production to non-destructive actions by setting database actions to `validate` or `none`.
