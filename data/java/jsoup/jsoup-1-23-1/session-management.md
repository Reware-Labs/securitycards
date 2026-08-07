# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: session management

## session management

### Maintain Isolated Session Contexts and Cookies

**Use when**

Managing multi-step HTTP interactions and session state in `Jsoup` connections to preserve isolated path-scoped cookie contexts.

**Secure rules**

**Rule 1: Utilize Jsoup sessions to maintain isolated path-scoped cookie contexts.**

Use `Jsoup.newSession()` when executing multi-step HTTP interactions to ensure path-scoped cookie handling and state isolation. Do not share session objects across unrelated user operations or global contexts.

```java
Connection session = Jsoup.newSession();
session.userAgent("MyApp/1.0");

Document loginDoc = session.newRequest()
    .url("https://example.com/login")
    .data("username", user, "password", pass)
    .post();

Document profileDoc = session.newRequest()
    .url("https://example.com/user/profile")
    .get();
```
