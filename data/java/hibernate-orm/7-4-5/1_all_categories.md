# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`

## Category: access control

### Isolate Multi-Tenant Data with Authenticated Security Contexts

**Use when**

Enabling multi-tenancy in Hibernate session factories and configuring tenant identification for data isolation.

**Secure rules**

**Rule 1: Explicitly specify the tenant identifier when opening multitenant sessions**

When the application does not use a `CurrentTenantIdentifierResolver`, pass the applicable tenant identifier through `SessionFactory.withOptions()` when opening each session.

```java
try (Session session = sessionFactory.withOptions()
        .tenantIdentifier(tenantId)
        .openSession()) {
    // Perform operations for this tenant.
}
```


## Category: api contract misuse

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


## Category: boundary control

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


## Category: configuration source integrity

### Validate dynamic event listener configurations from trusted sources

**Use when**

Configuring event listeners or initializing the SessionFactory in Hibernate.

**Secure rules**

**Rule 1: Register fixed event listener classes programmatically instead of accepting externally supplied class names**

When event listener selection must not be externally configurable, register the application’s known listener class through an `Integrator` and `EventListenerRegistry` instead of constructing `hibernate.event.listener.*` property values from external input.

```java
public final class ApplicationEventIntegrator implements Integrator {
    @Override
    public void integrate(
            Metadata metadata,
            BootstrapContext bootstrapContext,
            SessionFactoryImplementor sessionFactory) {
        sessionFactory.getEventListenerRegistry().appendListeners(
                EventType.AUTO_FLUSH,
                CustomAutoFlushListener.class
        );
    }
}
```


## Category: deserialization

### Prevent Binary Deserialization Vulnerabilities by Replacing Default Serialized Mappings with Safe Converters

**Use when**

Mapping basic attributes whose Java types implement `java.io.Serializable` inside Hibernate domain entities.

**Secure rules**

**Rule 1: Avoid relying on default Java binary serialization fallback for basic attributes and use explicit safe converters.**

When mapping basic attributes that implement `java.io.Serializable`, do not rely on Hibernate's default binary serialization fallback to read database records. Instead, explicitly implement an `AttributeConverter` or custom `UserType` to serialize object state safely into standard text formats like JSON.

```java
@Converter
public class UserPreferencesConverter implements AttributeConverter<UserPreferences, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(UserPreferences attribute) {
        if (attribute == null) return null;
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize preferences", e);
        }
    }

    @Override
    public UserPreferences convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return MAPPER.readValue(dbData, UserPreferences.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to deserialize preferences", e);
        }
    }
}
```


## Category: escape hatch

### Restrict raw SQL modifications in StatementInspector

**Use when**

When registering custom StatementInspector instances to inspect or modify SQL statements before execution.

**Secure rules**

**Rule 1: Keep auditing StatementInspector implementations non-mutating**

When a `StatementInspector` is used only for auditing or observation, return `null` so Hibernate executes the original SQL unchanged instead of replacing it with modified SQL.

```java
public final class AuditingStatementInspector implements StatementInspector {
    @Override
    public String inspect(String sql) {
        audit(sql);
        return null;
    }

    private void audit(String sql) {
        // Record the statement according to the application's audit policy.
    }
}

HibernatePersistenceConfiguration config =
        new HibernatePersistenceConfiguration("prod-pu")
                .statementInspector(AuditingStatementInspector.class);
```


## Category: injection

### Use Parameterized Queries for Hibernate HQL and Native SQL

**Use when**

Building HQL, JPQL, or native SQL queries that incorporate dynamic values or collection inputs.

**Secure rules**

**Rule 1: Bind untrusted values through query parameters instead of concatenating query strings.**

Use named parameters with `setParameter` or collection parameters with `setParameterList` to ensure inputs are safely bound via parameter setters and kept separate from query syntax.

```java
List<Zoo> result = session.createQuery(
        "FROM Zoo z WHERE z.name IN (?1) and z.address.city IN (?2)", Zoo.class)
    .setParameterList(1, namesArray)
    .setParameterList(2, citiesArray)
    .list();
```


## Category: input contract definition

### Enforce entity input validation and constraints using Jakarta Bean Validation

**Use when**

When defining entity models and persistence lifecycle operations to ensure input data matches required constraints, allowed types, and length limits.

**Secure rules**

**Rule 1: Apply Jakarta Bean Validation constraints and configure validation groups to validate entity inputs before database persistence.**

Use standard Jakarta Validation annotations such as `NotNull`, `Size`, `Min`, `Max`, `Email`, and `NotEmpty` on entity attributes. Configure validation operation groups in persistence settings to ensure validation executes during pre-persist and pre-update events.

```java
@Entity
public class UserAccount {
    @NotNull
    @Size(min = 3, max = 50)
    private String username;

    @NotNull
    @Email
    private String email;
}
```


## Category: resource exhaustion

### Configure Connection Pool Limits, Timeouts, and Production Providers

**Use when**

Configuring database connectivity, connection pools, and lifecycle management for production deployments.

**Secure rules**

**Rule 1: Explicitly configure a production-grade connection pool provider and enforce maximum pool sizing limits.**

Do not rely on Hibernate's default unmanaged fallback connection providers in production. Explicitly configure a production connection pool such as HikariCP, Agroal, or C3P0, and set appropriate pool bounds using properties like `hibernate.hikari.maximumPoolSize` or `hibernate.c3p0.max_size` to prevent resource exhaustion under heavy traffic.

```java
Map<String, Object> settings = new HashMap<>();
settings.put("hibernate.connection.url", "jdbc:postgresql://db.example.com:5432/appdb");
settings.put("hibernate.connection.user", dbUser);
settings.put("hibernate.connection.password", dbPassword);
settings.put("hibernate.hikari.maximumPoolSize", "20");
settings.put("hibernate.hikari.minimumIdle", "5");
settings.put("hibernate.hikari.idleTimeout", "300000");
```

**Rule 2: Set explicit login timeouts and ensure proper session factory shutdown to prevent connection thread hangs.**

Configure `hibernate.connection.loginTimeout` to prevent application threads from blocking indefinitely when the database backend is unresponsive. Additionally, ensure the application lifecycle properly closes the `SessionFactory` or connection provider on shutdown to release pooled resources.

```java
Map<String, Object> settings = new HashMap<>();
settings.put(JdbcSettings.CONNECTION_PROVIDER, "hikari");
settings.put(JdbcSettings.LOGIN_TIMEOUT, 10);
// Ensure sessionFactory.close() is invoked on application shutdown.
```

**Rule 3: Configure connection isolation and autocommit directly on external DataSource instances.**

When using `DataSourceConnectionProvider`, Hibernate explicitly ignores properties like `hibernate.connection.autocommit` and `hibernate.connection.isolation`. Configure these settings directly on the underlying `DataSource` connection pool instance before passing it to Hibernate.

```java
HikariDataSource dataSource = new HikariDataSource();
dataSource.setJdbcUrl("jdbc:postgresql://localhost:5432/mydb");
dataSource.setAutoCommit(false);
dataSource.setTransactionIsolation("TRANSACTION_READ_COMMITTED");

Map<String, Object> settings = new HashMap<>();
settings.put(JdbcSettings.DATASOURCE, dataSource);
```


### Prevent Resource Exhaustion and Memory Overload During Large Queries and Batches

**Use when**

Use when writing queries, pagination routines, and batch persistence operations that handle large volumes of data to protect JVM heap and database resources from exhaustion.

**Secure rules**

**Rule 1: Apply explicit pagination limits to all queries processing user-supplied filters or large datasets.**

Always enforce pagination bounds using `Query#setMaxResults()` and `Query#setFirstResult()` to prevent unbounded queries from consuming excessive JVM memory and triggering out-of-memory errors.

```java
TypedQuery<Person> query = session.createQuery(
    "select p from Person p order by p.id", Person.class
);
query.setFirstResult(offset);
query.setMaxResults(pageSize);
List<Person> page = query.getResultList();
```

**Rule 2: Flush and clear persistence context periodically during bulk batch operations.**

Call `session.flush()` and `session.clear()` at regular intervals during large batch inserts or updates to clear the first-level session cache and avoid memory exhaustion and connection pool starvation.

```java
for (int i = 0; i < 100000; i++) {
    Person person = new Person(i);
    session.persist(person);
    if (i % 50 == 0) {
        session.flush();
        session.clear();
    }
}
```

**Rule 3: Promptly close scrollable and streamed result sets using try-with-resources blocks.**

Wrap `ScrollableResults` and result streams in a try-with-resources block or explicitly close them to release underlying database cursors and prevent connection pool starvation.

```java
try (ScrollableResults<Person> results = query.scroll()) {
    while (results.next()) {
        Person person = results.get();
    }
}
```


## Category: runtime environment hardening

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


## Category: secret handling

### Externalize Database Credentials and Avoid Hardcoding Secrets

**Use when**

Configuring database connections and initializing `EntityManagerFactory` or `StandardServiceRegistry` in Hibernate ORM applications.

**Secure rules**

**Rule 1: Load database credentials dynamically at runtime using environment variables or external secret managers instead of embedding them in source code or configuration files.**

Do not hardcode sensitive database passwords or usernames in version-controlled files like `persistence.xml` or source code. Pass credentials dynamically at runtime by fetching them from environment variables and supplying them through property maps when building registries or creating entity manager factories.

```java
Map<String, Object> settings = new HashMap<>();
settings.put("hibernate.connection.url", System.getenv("JDBC_URL"));
settings.put("hibernate.connection.username", System.getenv("JDBC_USER"));
settings.put("hibernate.connection.password", System.getenv("JDBC_PASSWORD"));
StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
    .applySettings(settings)
    .build();
```


## Category: security control integrity

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
