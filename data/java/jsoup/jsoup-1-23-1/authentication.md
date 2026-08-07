# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: authentication

## authentication

### Authenticate Requests Securely Using Jsoup Request Authenticators

**Use when**

When configuring HTTP or proxy authentication for Jsoup connection sessions and requests to verify identity and supply credentials.

**Secure rules**

**Rule 1: Supply authentication credentials safely using RequestAuthenticator and validate request hosts to prevent credential leakage.**

Use Jsoup's `RequestAuthenticator` interface to manage authentication credentials instead of manual headers. Inspect the challenge context using `auth.isServer()` and `auth.isProxy()`, and validate request hosts with `auth.url().getHost()` before returning credentials.

```java
Connection session = Jsoup.newSession()
    .proxy("proxy.example.com", 8080)
    .auth(auth -> {
        if (auth.isServer()) {
            if ("example.com".equalsIgnoreCase(auth.url().getHost())) {
                return auth.credentials("user", "password");
            }
            return null;
        } else {
            return auth.credentials("proxy-user", "proxy-password");
        }
    });
```
