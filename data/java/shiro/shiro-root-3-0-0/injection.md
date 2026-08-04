# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: injection

## injection

### Use parameterized queries for custom JdbcRealm SQL statements

**Use when**

When configuring custom SQL queries for authentication, roles, or permissions in `JdbcRealm`.

**Secure rules**

**Rule 1: Use JDBC parameter placeholders instead of string concatenation in custom realm SQL statements.**

When customizing SQL queries via `setAuthenticationQuery`, `setUserRolesQuery`, or `setPermissionsQuery`, ensure queries use JDBC parameter placeholders `?` rather than dynamic string concatenation to prevent SQL injection vulnerabilities.

```java
JdbcRealm realm = new JdbcRealm();
realm.setAuthenticationQuery("SELECT password, salt FROM app_users WHERE username = ?");
realm.setUserRolesQuery("SELECT role_name FROM app_user_roles WHERE username = ?");
realm.setPermissionsQuery("SELECT perm_name FROM app_role_perms WHERE role_name = ?");
```
