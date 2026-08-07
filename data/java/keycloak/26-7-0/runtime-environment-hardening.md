# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: runtime environment hardening

## runtime environment hardening

### Configure Production Database and Disable Development Mode

**Use when**

Configuring Keycloak for production deployment to replace volatile or development environments with production-grade backends.

**Secure rules**

**Rule 1: Specify a supported production-grade relational database instead of using the embedded development database.**

Replace the default embedded `dev-file` database with a supported production-grade relational database such as PostgreSQL, MySQL, Oracle, or Microsoft SQL Server prior to deploying Keycloak to production environments. Define the database vendor and connection details inside `conf/keycloak.conf` or during build configurations.

```properties
db=postgres
db-url-host=postgres.prod.internal
db-username=keycloak
```
