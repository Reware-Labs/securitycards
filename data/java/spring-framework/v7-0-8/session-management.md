# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: session management

## session management

### Configure Secure and HttpOnly Cookie Attributes for Sessions

**Use when**

Developing and configuring session cookie resolvers, response cookies, or managing cookie security attributes in Spring Web applications.

**Secure rules**

**Rule 1: Explicitly set secure, HttpOnly, and SameSite attributes when creating and configuring session cookies**

When creating cookies for sensitive state or session tokens using `ResponseCookie`, explicitly set boolean flags such as `httpOnly(true)` and `secure(true)`, along with an appropriate `sameSite` policy like `'Strict'` or `'Lax'`. Omitting HttpOnly permits client-side script access, omitting Secure permits transmission over insecure channels, and omitting SameSite allows broader cross-site cookie attachment.

```java
ResponseCookie cookie = ResponseCookie.from("SESSION", sessionId)
    .httpOnly(true)
    .secure(true)
    .sameSite("Lax")
    .path("/")
    .maxAge(Duration.ofHours(2))
    .build();
```

**Rule 2: Preserve secure cookie defaults and enforce flags when customizing session cookie resolvers.**

When using `CookieWebSessionIdResolver` to manage session cookies, ensure security flags are not downgraded or overridden with unsafe values. Use `addCookieInitializer` to explicitly enforce `secure(true)` and stricter SameSite policies when operating behind TLS-terminating proxies.

```java
CookieWebSessionIdResolver resolver = new CookieWebSessionIdResolver();
resolver.setCookieName("SESSION");
resolver.addCookieInitializer(builder -> builder
    .secure(true)
    .sameSite("Strict"
));
```
