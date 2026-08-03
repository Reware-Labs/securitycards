# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: session management

## session management

### Configure Persistent Session Storage and Enterprise Cache Management

**Use when**

Configuring Apache Shiro session management and persistence mechanisms for production applications requiring durable sessions across application restarts and clustered deployments.

**Secure rules**

**Rule 1: Configure a persistent SessionDAO implementation on DefaultSessionManager to avoid in-memory session loss.**

Do not rely on the default `MemorySessionDAO` in production environments as it stores sessions exclusively in JVM memory without disk persistence or cluster replication. Explicitly inject a durable or enterprise `SessionDAO` implementation using `setSessionDAO()` and attach a persistent `CacheManager`.

```java
DefaultSessionManager sessionManager = new DefaultSessionManager();
sessionManager.setSessionDAO(enterpriseSessionDAO);
sessionManager.setCacheManager(cacheManager);
```

**Rule 2: Maintain automatic deletion of invalid sessions in session persistence to prevent resource exhaustion.**

Keep `deleteInvalidSessions` set to `true` by default on `DefaultSessionManager` so that expired and stopped sessions are automatically purged from the backing `SessionDAO` storage. Avoid disabling this setting unless an external automated maintenance task is configured to purge orphaned sessions.

```java
DefaultSessionManager sessionManager = new DefaultSessionManager();
sessionManager.setDeleteInvalidSessions(true);
```

**Rule 3: Validate session identifiers when extending AbstractSessionDAO for custom session persistence.**

When implementing custom session persistence by extending `AbstractSessionDAO`, always generate or assign a non-null session identifier within `doCreate` and ensure that `doReadSession` returns `null` when a session is missing so that lookup operations correctly handle unknown sessions.

```java
public class CustomSessionDAO extends AbstractSessionDAO {
    @Override
    protected Serializable doCreate(Session session) {
        Serializable sessionId = generateSessionId(session);
        assignSessionId(session, sessionId);
        sessionStore.save(sessionId, session);
        return sessionId;
    }

    @Override
    protected Session doReadSession(Serializable sessionId) {
        return sessionStore.get(sessionId);
    }
}
```


### Enforce Secure Cookie Attributes and Disable URL Session Rewriting

**Use when**

When configuring session cookies, remember-me cookies, or web session managers to protect session identifiers in transit and storage.

**Secure rules**

**Rule 1: Enable HttpOnly and Secure cookie flags and disable session ID URL rewriting.**

Configure session and remember-me cookies to enforce secure attributes such as HttpOnly, Secure, and SameSite restrictions. Ensure that session ID URL rewriting remains disabled (`sessionIdUrlRewritingEnabled = false`) to prevent session tokens from leaking into request URIs and logs.

```java
DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
Cookie cookie = sessionManager.getSessionIdCookie();
cookie.setHttpOnly(true);
cookie.setSecure(true);
sessionManager.setSessionIdUrlRewritingEnabled(false);
```


### Invalidate Sessions and Rotate Identifiers on Authentication and Logout

**Use when**

When managing user authentication lifecycles, handling user logout, or configuring security managers to prevent session fixation and hijacking.

**Secure rules**

**Rule 1: Explicitly invoke logout and ensure automatic session invalidation and identifier rotation occurs during authentication.**

Explicitly invoke `Subject.logout()` during user sign-out to clear principal context and invalidate session attributes. Rely on Shiro's security manager to automatically rotate session identifiers and migrate session attributes during successful authentication to prevent session fixation and hijacking.

```java
Subject subject = SecurityUtils.getSubject();
subject.logout();
subject.login(new UsernamePasswordToken("newuser", "password"));
```
