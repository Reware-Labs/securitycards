# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: secret handling

## secret handling

### Prevent Secret Disclosure in Logs and String Conversion

**Use when**

When logging diagnostic information, writing error messages, or handling database and messaging credentials in Spring applications.

**Secure rules**

**Rule 1: Avoid logging credential values or parameter-value maps that contain secrets**

Do not pass credentials or parameter-value maps such as MapSqlParameterSource.getValues() to loggers, string formatters, or exception details. Instead, log only safe non-sensitive metadata or parameter names.

```java
// Unsafe: getValues() exposes all parameter values
logger.debug("Executing query with parameters: {}", paramSource.getValues());

// Safe: Log parameter names without revealing sensitive values
if (logger.isDebugEnabled() && paramSource.getParameterNames() != null) {
    logger.debug("Executing query with parameters: {}", Arrays.toString(paramSource.getParameterNames()));
}
```

**Rule 2: Load credentials from external configuration instead of hardcoding them**

Avoid embedding plain-text secrets directly into source code, bean definitions, or unsecured configuration files. Inject database and connection factory credentials from externalized property sources via @Value or environment lookup, and secure the underlying property source separately.

```java
@Bean
public UserCredentialsConnectionFactoryAdapter connectionFactory(
        ConnectionFactory targetConnectionFactory,
        @Value("${jms.username}") String username,
        @Value("${jms.password}") String password) {
    UserCredentialsConnectionFactoryAdapter adapter = new UserCredentialsConnectionFactoryAdapter();
    adapter.setTargetConnectionFactory(targetConnectionFactory);
    adapter.setUsername(username);
    adapter.setPassword(password);
    return adapter;
}
```
