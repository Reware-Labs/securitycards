# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: access control

## access control

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
