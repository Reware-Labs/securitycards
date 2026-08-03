# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: api contract misuse

## api contract misuse

### Adhere to Apache Shiro API Contracts and Method Signatures

**Use when**

When configuring realms, filters, session management, and authentication tokens in Apache Shiro applications to prevent API contract violations and runtime exceptions.

**Secure rules**

**Rule 1: Avoid passing thread objects to subject context association methods**

Do not pass a `java.lang.Thread` instance directly to `subject.associateWith(Runnable)` or `subject.execute(Runnable)`. DelegatingSubject throws an `UnsupportedOperationException` when provided a Thread argument due to JDK context inheritance restrictions.

```java
Runnable task = () -> {
    // Perform secure background operation
};
Runnable boundTask = subject.associateWith(task);
executorService.submit(boundTask);
```

**Rule 2: Maintain a non-null password service on PasswordMatcher**

Ensure that `PasswordMatcher` is configured with a non-null `PasswordService` to perform credentials matching and to create simulated credentials. Setting `passwordService` to null will result in an `IllegalStateException` during authentication.

```java
PasswordMatcher matcher = new PasswordMatcher();
DefaultPasswordService passwordService = new DefaultPasswordService();
matcher.setPasswordService(passwordService);
```

**Rule 3: Use the Subject API instead of invoking SecurityManager directly**

Initiate authentication and logout using the `Subject` instance obtained via `SecurityUtils.getSubject()` rather than invoking `SecurityManager.login()` or `SecurityManager.logout()` directly. The SecurityManager methods are low-level framework hooks that do not manage application thread-local subject state automatically.

```java
Subject currentUser = SecurityUtils.getSubject();
UsernamePasswordToken token = new UsernamePasswordToken(username, password);
currentUser.login(token);

// Perform authenticated operations

currentUser.logout();
```

**Rule 4: Apply filter configuration strings only to PathMatchingFilter types**

When mapping filters using `filterConfig()`, configuration strings can only be supplied to implementations of `PathMatchingFilter`. Supplying a configuration value for non-PathMatchingFilter types causes a `ConfigurationException`.

```java
addFilterChain("/protected/**", filterConfig(PERMS, "user:read"));
addFilterChain("/public/**", filterConfig(ANON));
```

**Rule 5: Perform salt validation within individual realms prior to merging**

Do not rely on `SimpleAuthenticationInfo.merge` to aggregate credentials salts across multiple realms. Credential verification and salt validation must occur within each realm's authentication check before merging.

```java
@Override
protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
    User user = userStore.findUser(((UsernamePasswordToken) token).getUsername());
    ByteSource salt = ByteSource.Util.bytes(user.getSalt());
    return new SimpleAuthenticationInfo(user.getUsername(), user.getPasswordHash(), salt, getName());
}
```

**Rule 6: Assign unique names to all configured realm instances**

All realms configured for a single application must return a unique name from `getName()`. When creating multiple realm instances (especially of the same class), call `setName` with distinct values so each realm has an application-unique identifier.

```java
JdbcRealm userRealm = new JdbcRealm();
userRealm.setName("primaryUserRealm");

JdbcRealm adminRealm = new JdbcRealm();
adminRealm.setName("secondaryAdminRealm");
```

**Rule 7: Implement ValidatingSession Interface for Custom Session Implementations**

When extending session management with custom `Session` implementations, custom objects must implement the `ValidatingSession` interface or override `doValidate(Session)`. Failure to implement `ValidatingSession` causes `doValidate` to throw an `IllegalStateException` at runtime.

```java
public class CustomSession implements Session, ValidatingSession {
    @Override
    public void validate() throws InvalidSessionException {
        if (isExpired()) {
            throw new ExpiredSessionException("Session expired");
        }
    }
}
```

**Rule 8: Supply compatible UsernamePasswordToken objects to SimpleAccountRealm**

Ensure that tokens submitted to authentication flows evaluated by `SimpleAccountRealm` are instances of `UsernamePasswordToken`, as `SimpleAccountRealm.doGetAuthenticationInfo` explicitly casts the incoming token to `UsernamePasswordToken`.

```java
UsernamePasswordToken token = new UsernamePasswordToken(username, password);
Subject currentUser = SecurityUtils.getSubject();
currentUser.login(token);
```
