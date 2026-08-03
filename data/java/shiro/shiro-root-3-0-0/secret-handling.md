# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: secret handling

## secret handling

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
