# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: secret handling

## secret handling

### Isolate authentication contexts and handle credentials securely in connection requests

**Use when**

Configuring request authenticators and handling sensitive headers or session tokens during connection requests across different origins or persistent thread pools.

**Secure rules**

**Rule 1: Set authenticators directly on isolated Connection instances for each request execution to prevent cross-tenant credential leakage.**

Avoid sharing authentication contexts across persistent thread pools where ThreadLocal states might retain sensitive data. Instead, configure authenticators directly on isolated Connection instances for each distinct request execution.

```java
Connection conn = Jsoup.connect("https://example.com/protected")
    .authenticator(ctx -> new PasswordAuthentication(username, password.toCharArray()));
Document doc = conn.get();
```

**Rule 2: Rely on automatic credential stripping on cross-origin redirects to prevent sensitive token leakage.**

Allow Jsoup connection handling to automatically sanitize sensitive headers like `Authorization`, `Cookie`, and `Cookie2` when following redirects across different origins while retaining them for same-origin redirects.

```java
Connection con = Jsoup.connect("https://example.com/login-redirect")
    .header("Authorization", "Bearer secret-token")
    .cookie("session", "sessionIdValue");
Document doc = con.get();
```
