# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: file handling

## file handling

### Configure Static File Paths to Prevent Directory Traversal

**Use when**

When configuring local filesystem static file paths and endpoints in Quarkus applications to serve web resources securely.

**Secure rules**

**Rule 1: Specify safe relative paths without directory traversal elements in application properties.**

Ensure that relative paths and endpoints do not contain directory traversal constructs like `..` or wildcards like `*`. Configure safe relative paths directly in `application.properties` using properties such as `quarkus.http.static-dir.path` and `quarkus.http.static-dir.endpoint` to prevent unauthorized access to sensitive files outside the intended web root.

```properties
quarkus.http.static-dir.path=static
quarkus.http.static-dir.endpoint=/
```
