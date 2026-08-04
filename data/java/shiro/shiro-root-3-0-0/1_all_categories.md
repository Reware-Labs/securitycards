# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`

## Category: access control

### Configure Granular Permission Resolution and Wildcard Matching Safely

**Use when**

When defining wildcard permissions, setting up role permission resolvers, or configuring case sensitivity for resource identifiers.

**Secure rules**

**Rule 1: Explicitly configure case sensitivity when protecting case-sensitive resources.**

WildcardPermission defaults to case-insensitive matching by converting permission strings to lowercase upon construction. If your application's domain, actions, or resource identifiers rely on case differentiation, instantiate `WildcardPermission` explicitly with caseSensitive set to true.

```java
WildcardPermission requiredPermission = new WildcardPermission("document:READ:DocId123", true);
Subject subject = SecurityUtils.getSubject();
if (subject.isPermitted(requiredPermission)) {
    // Execute protected action
}
```

**Rule 2: Implement RolePermissionResolver to map role strings to explicit permissions securely.**

Implement `RolePermissionResolver` when underlying security data stores or realms return role names rather than explicit permission instances. Custom resolvers must safely handle unexpected or null role inputs and return empty collections for unmapped roles.

```java
public class CustomRolePermissionResolver implements RolePermissionResolver {
    @Override
    public Collection<Permission> resolvePermissionsInRole(String roleString) {
        if (roleString == null) {
            return Collections.emptyList();
        }
        switch (roleString) {
            case "admin":
                return List.of(new WildcardPermission("*"));
            case "editor":
                return List.of(new WildcardPermission("article:*"));
            default:
                return Collections.emptyList();
        }
    }
}
```


### Enforce Explicit Authorization Checks and Fail-Closed Access Control

**Use when**

When performing authorization checks in business logic or implementing custom AuthorizingRealm and Authorizer components.

**Secure rules**

**Rule 1: Call explicit permission assertion methods instead of unhandled boolean checks.**

Use assertion methods like `checkPermission` or `checkRole` on the current `Subject` instance to enforce authorization barriers prior to performing sensitive business logic. These methods throw an `AuthorizationException` if authorization fails, stopping unprivileged execution immediately.

```java
Subject currentUser = SecurityUtils.getSubject();
currentUser.checkPermission("user:edit:123");
// Proceed with user edit logic
```

**Rule 2: Return null from doGetAuthorizationInfo to enforce fail-closed access control.**

When implementing custom `AuthorizingRealm` instances, returning `null` from `doGetAuthorizationInfo(PrincipalCollection)` causes Shiro to fail closed. In this state, permission and role checks evaluate to false, while explicit check assertions throw an `UnauthorizedException`.

```java
@Override
protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
    User user = userStore.findByPrincipals(principals);
    if (user == null) {
        return null; // Denies all permissions and roles by default
    }
    SimpleAuthorizationInfo info = new SimpleAuthorizationInfo(user.getRoles());
    info.addObjectPermissions(user.getPermissions());
    return info;
}
```


### Invalidate Authorization Caches Upon Permission Updates

**Use when**

When modifying user roles, permissions, or authorization data in custom realms with caching enabled.

**Secure rules**

**Rule 1: Explicitly clear cached authorization info when user permissions or roles are modified.**

When authorization caching is enabled in an `AuthorizingRealm`, custom realms and administration logic must explicitly clear the cached `AuthorizationInfo` by calling `clearCachedAuthorizationInfo(principals)` or `clearCache(principals)` whenever a user's permissions or roles are updated to prevent privilege retention after rights are revoked.

```java
public class CustomAuthorizingRealm extends AuthorizingRealm {
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        return fetchAuthorizationInfoFromDatabase(principals);
    }

    public void onUserPermissionsUpdated(PrincipalCollection principals) {
        // Invalidate cached authorization info so fresh rights are re-evaluated
        clearCachedAuthorizationInfo(principals);
    }
}
```


## Category: api contract misuse

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


## Category: authentication

### Enforce Strict Subject Authentication State Checks

**Use when**

Authorizing sensitive operations and managing authenticated versus remembered user states.

**Secure rules**

**Rule 1: Distinguish authenticated subjects from remembered subjects for sensitive operations**

Always check `subject.isAuthenticated()` explicitly before permitting access to sensitive functionality. Do not treat subjects where `isRemembered()` is true as fully authenticated since remember-me cookies only assert previous identity sessions.

```java
Subject currentUser = SecurityUtils.getSubject();
if (!currentUser.isAuthenticated()) {
    currentUser.login(token);
}
```


### Mitigate Username Enumeration and Timing Attacks

**Use when**

Handling authentication failures and missing account lookups in custom realms and login endpoints.

**Secure rules**

**Rule 1: Implement simulated credentials and generic exception handling to prevent user enumeration**

Override `createSimulatedCredentials()` in custom `CredentialsMatcher` implementations to execute dummy hashing for non-existent accounts and return generic error messages to clients without revealing whether the username exists.

```java
public class SecureCredentialsMatcher implements CredentialsMatcher {
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        return false;
    }

    @Override
    public Optional<AuthenticationInfo> createSimulatedCredentials() {
        return Optional.of(new SimpleAuthenticationInfo("dummy", "unmatchableHashedSecret", "realmName"));
    }
}
```


### Secure Password and Credential Verification in Realms

**Use when**

Implementing credential verification and hashing in Apache Shiro realms to prevent identity impersonation and credential compromise.

**Secure rules**

**Rule 1: Use PasswordMatcher with DefaultPasswordService for hashed password credentials**

Configure a `PasswordMatcher` linked with a `DefaultPasswordService` on a Realm that uses password-based accounts. This employs best-practices comparisons for hashed text passwords. Store only the encrypted value returned by the PasswordService; never store the original plaintext password.

```java
DefaultPasswordService passwordService = new DefaultPasswordService();
PasswordMatcher matcher = new PasswordMatcher();
matcher.setPasswordService(passwordService);
realm.setCredentialsMatcher(matcher);
```

**Rule 2: Store unique per-user salts using AuthenticationInfo**

Always return credentials salt as a `ByteSource` via `SimpleAuthenticationInfo` using cryptographically secure random values rather than predictable user-submitted or static salts.

```java
ByteSource salt = ByteSource.Util.bytes(user.getSalt());
SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(
    user.getUsername(),
    user.getPasswordHash(),
    salt,
    getName()
);
```


## Category: boundary control

### Explicitly Bind and Execute Actions Within Created Subject Contexts

**Use when**

When programmatically creating a Subject context using `SecurityManager.createSubject()` or `Subject.Builder` and executing operations that rely on the security context boundary.

**Secure rules**

**Rule 1: Explicitly bind or execute actions within the context of programmatically created Subjects to enforce trusted context boundaries.**

When creating a Subject programmatically, the returned instance is locally scoped and not automatically bound to the thread. You must use `Subject.execute()` to ensure downstream operations run within the correct security context instead of failing over to an unauthenticated or incorrect context.

```java
Subject subject = new Subject.Builder(securityManager)
    .authenticated(true)
    .buildSubject();

subject.execute(() -> {
    // Code here executes within the context of the custom Subject
    doSecuredWork();
});
```


## Category: cryptography

### Configure Persistent Cipher Keys and Flush Cipher Streams

**Use when**

When managing remember-me encryption keys and utilizing stream-based cipher operations.

**Secure rules**

**Rule 1: Explicitly configure a strong, persistent symmetric cipher key on `AbstractRememberMeManager`.**

Avoid relying on default instance-level generated keys by configuring a persistent cipher key using `setCipherKey` so that remembered identity tokens can be decrypted across application restarts.

```java
byte[] secretCipherKey = getSecretKeyFromVault();
AbstractRememberMeManager rememberMeManager = (AbstractRememberMeManager) securityManager.getRememberMeManager();
rememberMeManager.setCipherKey(secretCipherKey);
```

**Rule 2: Explicitly flush and close both input and output streams after stream-based cipher operations.**

CipherService stream methods do not automatically flush or close streams upon completion, so developers must manage streams explicitly to prevent truncated outputs or resource exhaustion.

```java
try (InputStream in = Files.newInputStream(inputPath);
     OutputStream out = Files.newOutputStream(outputPath)) {
    cipherService.encrypt(in, out, keyBytes);
    out.flush();
} catch (CryptoException e) {
    // Handle cryptographic error
}
```


### Configure Strong Cryptographic Hash Algorithms and Password Services

**Use when**

When configuring password hashing, credential matchers, and hash services for user authentication.

**Secure rules**

**Rule 1: Configure HashedCredentialsMatcher to use strong cryptographic hash algorithms such as SHA-256 or higher.**

Avoid legacy algorithms like MD5 and SHA-1 which are vulnerable to collisions and fast brute-forcing. Initialize `HashedCredentialsMatcher` with a strong algorithm name and appropriate hash iterations.

```java
HashedCredentialsMatcher matcher = new HashedCredentialsMatcher(Sha256Hash.ALGORITHM_NAME);
matcher.setHashIterations(1024);
```

**Rule 2: Use ParsableHashFormat to maintain backward compatibility for saved password hashes.**

When customizing the HashFormat in `DefaultPasswordService`, ensure the configured format implements `ParsableHashFormat` such as `Shiro2CryptFormat` so saved password hashes encode their algorithm, parameters, and salt.

```java
DefaultPasswordService passwordService = new DefaultPasswordService();
passwordService.setHashFormat(new Shiro2CryptFormat());
```

**Rule 3: Use Shiro1CryptFormat for lossless cryptographic hash storage.**

Ensure applications handle full Base64-encoded digest and salt tokens when storing hashed credentials using `Shiro1CryptFormat` to allow lossless reconstruction of `Hash` objects.

```java
Shiro1CryptFormat format = new Shiro1CryptFormat();
String formattedHash = format.format(hash);
Hash restoredHash = format.parse(formattedHash);
```


### Generate and Manage Cryptographically Secure Salts and Initialization Vectors

**Use when**

When performing encryption operations, cipher services, and salting credentials in custom realms.

**Secure rules**

**Rule 1: Maintain auto-generated initialization vectors and avoid ECB mode for block cipher services.**

Keep initialization vector generation enabled by default using `AesCipherService` and avoid switching to Electronic Codebook mode to prevent exposure of ciphertext patterns.

```java
DefaultBlockCipherService cipherService = new AesCipherService();
byte[] encrypted = cipherService.encrypt(plainText, key).getBytes();
```

**Rule 2: Use cryptographically strong random salts for password and credential hashing.**

Always generate a cryptographically strong random salt for each user using `SecureRandomNumberGenerator` rather than using predictable values such as usernames or static strings.

```java
SecureRandomNumberGenerator rng = new SecureRandomNumberGenerator();
ByteSource salt = rng.nextBytes();
String hashedPassword = new Sha256Hash(plainPassword, salt, 1024).toBase64();
```

**Rule 3: Explicitly configure cipher services with byte-aligned initialization vector sizes and strong secure random generators.**

Specify initialization vector sizes in bits as a positive multiple of 8, and supply an explicit strong `SecureRandom` instance if the default provider is insufficient.

```java
JcaCipherService cipherService = new AesCipherService();
cipherService.setInitializationVectorSize(128);
SecureRandom secureRandom = SecureRandom.getInstanceStrong();
cipherService.setSecureRandom(secureRandom);
```


## Category: csrf

### Configure LogoutFilter to require POST requests against Cross-Site Request Forgery

**Use when**

Configuring authentication and web filter chains where state-changing actions such as user logout must be protected against Cross-Site Request Forgery.

**Secure rules**

**Rule 1: Enable postOnlyLogout on LogoutFilter to require HTTP POST requests for user logout.**

By default, `LogoutFilter` accepts GET requests, which exposes logout functionality to Cross-Site Request Forgery and accidental session termination via browser link prefetching. Set `postOnlyLogout` to true so that non-POST requests receive an HTTP 405 Method Not Allowed response without performing subject logout.

```java
LogoutFilter logoutFilter = new LogoutFilter();
logoutFilter.setPostOnlyLogout(true);
logoutFilter.setRedirectUrl("/login");
```


## Category: deserialization

### Configure a Hardened Serializer for Remembered Identity Payloads

**Use when**

When managing remembered user identity payloads via `AbstractRememberMeManager` in Apache Shiro to prevent deserialization vulnerabilities.

**Secure rules**

**Rule 1: Supply a custom Serializer implementation with strict class filtering using setSerializer.**

To prevent gadget chain execution during Java object deserialization, avoid default insecure deserialization and configure `AbstractRememberMeManager` with a hardened serializer by calling `setSerializer` with an implementation that performs strict class filtering.

```java
rememberMeManager.setSerializer(new SafeRememberedIdentitySerializer());
```


## Category: injection

### Use parameterized queries for custom JdbcRealm SQL statements

**Use when**

When configuring custom SQL queries for authentication, roles, or permissions in `JdbcRealm`.

**Secure rules**

**Rule 1: Use JDBC parameter placeholders instead of string concatenation in custom realm SQL statements.**

When customizing SQL queries via `setAuthenticationQuery`, `setUserRolesQuery`, or `setPermissionsQuery`, ensure queries use JDBC parameter placeholders `?` rather than dynamic string concatenation to prevent SQL injection vulnerabilities.

```java
JdbcRealm realm = new JdbcRealm();
realm.setAuthenticationQuery("SELECT password, salt FROM app_users WHERE username = ?");
realm.setUserRolesQuery("SELECT role_name FROM app_user_roles WHERE username = ?");
realm.setPermissionsQuery("SELECT perm_name FROM app_role_perms WHERE role_name = ?");
```


## Category: input interpretation safety

### Validate Format Identifiers Before Resolving Hash Formats

**Use when**

Parsing and interpreting untrusted format strings or class identifiers when obtaining dynamic `HashFormat` instances.

**Secure rules**

**Rule 1: Validate format identifiers against an explicit allowlist or registered aliases before passing user-controlled strings to `getInstance()`.**

Prevent heuristic class loading and resolution issues by ensuring that untrusted strings are verified against expected format IDs or registered mappings before invoking `DefaultHashFormatFactory.getInstance()`.

```java
DefaultHashFormatFactory factory = new DefaultHashFormatFactory();
Map<String, String> customFormats = Map.of("myformat", "com.example.crypto.MyHashFormat");
factory.setFormatClassNames(customFormats);

if (customFormats.containsKey(userInput) || ProvidedHashFormat.byId(userInput) != null) {
    HashFormat format = factory.getInstance(userInput);
}
```


## Category: secret handling

### Protect Sensitive Credentials and Keys in Memory and Configuration

**Use when**

Handling passwords, encryption keys, and system secrets during authentication token creation, hashing, LDAP configuration, or cipher key setup in Apache Shiro.

**Secure rules**

**Rule 1: Pass passwords as character arrays and invoke clear after authentication**

Pass passwords as `char[]` arrays rather than `String` instances when instantiating `UsernamePasswordToken`, and always invoke `clear()` in a `finally` block after authentication completes to overwrite the internal password array with zeroes.

```java
UsernamePasswordToken token = new UsernamePasswordToken(username, passwordCharArray);
try {
    SecurityUtils.getSubject().login(token);
} finally {
    token.clear();
}
```

**Rule 2: Explicitly configure a cipher key for CookieRememberMeManager**

Explicitly set a secret encryption key on `CookieRememberMeManager` using `setCipherKey`. Although the default constructor generates a symmetric key, the official API documentation recommends providing your own key known only to your application.

```java
CookieRememberMeManager rememberMeManager = new CookieRememberMeManager();
byte[] cipherKey = Base64.decode(System.getenv("SHIRO_REMEMBER_ME_CIPHER_KEY"));
rememberMeManager.setCipherKey(cipherKey);
```

**Rule 3: Pass system user credentials securely for directory authorization queries**

Pass system user credentials via `setSystemUsername` and `setSystemPassword` securely through externalized configuration or environment variables rather than hardcoding them.

```ini
[main]
ldapRealm = org.apache.shiro.realm.ldap.DefaultLdapRealm
ldapRealm.contextFactory.systemUsername = cn=read-only-service,dc=example,dc=com
ldapRealm.contextFactory.systemPassword = ${env:LDAP_SYSTEM_PASSWORD}
```

**Rule 4: Format secret salts as Base64 strings when passing pepper parameters**

When passing a secret salt in `HashRequest` parameters under `SimpleHash.Parameters.PARAMETER_SECRET_SALT`, ensure the value is a Base64-encoded string.

```java
byte[] secretPepperBytes = loadPepperFromVault();
String base64Pepper = Base64.getEncoder().encodeToString(secretPepperBytes);

Map<String, Object> params = Map.of(
    SimpleHashProvider.Parameters.PARAMETER_SECRET_SALT, base64Pepper,
    SimpleHashProvider.Parameters.PARAMETER_ITERATIONS, 100_000
);
HashRequest request = new SimpleHashRequest(sourceByteSource, publicSalt, params);
```


## Category: security control integrity

### Preserve Global Filters and Security Rules When Customizing Shiro Web Components

**Use when**

When overriding default Shiro web filters, global configurations, or custom Spring bean definitions in a web application.

**Secure rules**

**Rule 1: Retain critical global security filters such as InvalidRequestFilter when overriding global filter chains.**

When overriding `globalFilters()`, ensure you retain security-critical global filters instead of discarding them. Removing foundational filters disables protections against URI path manipulation and request smuggling across the application.

```java
@Override
public List<FilterConfig<? extends Filter>> globalFilters() {
    List<FilterConfig<? extends Filter>> filters = new ArrayList<>(super.globalFilters());
    filters.add(filterConfig(MY_CUSTOM_GLOBAL_FILTER));
    return filters;
}
```

**Rule 2: Maintain complete security logic and path protection rules when defining custom Shiro web beans.**

Defining a custom bean for any Shiro web component suppresses default bean creation. Ensure custom implementations maintain complete security logic and avoid omitting critical URL path protection rules or filter configurations.

```java
@Bean
public ShiroFilterChainDefinition shiroFilterChainDefinition() {
    DefaultShiroFilterChainDefinition chainDefinition = new DefaultShiroFilterChainDefinition();
    chainDefinition.addPathDefinition("/admin/**", "authc, roles[admin]");
    chainDefinition.addPathDefinition("/**", "authc");
    return chainDefinition;
}
```


## Category: session management

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
