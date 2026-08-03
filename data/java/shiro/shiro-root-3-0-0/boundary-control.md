# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: boundary control

## boundary control

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
