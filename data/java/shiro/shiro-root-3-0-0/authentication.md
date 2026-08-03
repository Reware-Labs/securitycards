# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: authentication

## authentication

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
