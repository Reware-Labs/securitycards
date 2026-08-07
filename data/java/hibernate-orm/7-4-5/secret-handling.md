# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: secret handling

## secret handling

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
