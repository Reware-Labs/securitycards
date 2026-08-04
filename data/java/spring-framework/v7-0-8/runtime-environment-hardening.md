# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: runtime environment hardening

## runtime environment hardening

### Disable Debug Mode and Verbose Diagnostic Logging in Production

**Use when**

Configuring application production runtime environments, logging levels, and debugging properties for Spring components.

**Secure rules**

**Rule 1: Disable CGLIB debug mode in production environments.**

Do not set the `cglib.debugLocation` system property in production environments. When this property is set, `DebuggingClassWriter` turns on debug mode, automatically creating directory structures and writing generated `.class` files and `.asm` trace files to disk which can exhaust disk space or leak proxy structures.

```java
System.clearProperty("cglib.debugLocation");
```

**Rule 2: Disable stack trace logging in production cache error handlers.**

When instantiating `LoggingCacheErrorHandler`, ensure `logStackTraces` is set to false in production runtime environments. Reserve `logStackTraces = true` exclusively for active debug or development environments to prevent exposing internal operational details in logs.

```java
@Bean
public CacheErrorHandler cacheErrorHandler(Environment environment) {
    boolean isDebug = environment.acceptsProfiles(Profiles.of("dev", "debug"));
    return new LoggingCacheErrorHandler(isDebug);
}
```

**Rule 3: Restrict WebSocket logging levels in production environments.**

Avoid enabling `DEBUG` or `TRACE` logging levels for `LoggingWebSocketHandlerDecorator` in production environments. When TRACE logging is active, full message payloads can be recorded, and DEBUG logging records session metadata and error stack traces.

```properties
logging.level.org.springframework.web.socket.handler.LoggingWebSocketHandlerDecorator=INFO
```
