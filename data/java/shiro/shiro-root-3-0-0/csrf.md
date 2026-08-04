# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: csrf

## csrf

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
