# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: resource exhaustion

## resource exhaustion

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
