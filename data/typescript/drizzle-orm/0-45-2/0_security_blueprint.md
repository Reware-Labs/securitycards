# Security blueprint

Repository: `https://github.com/drizzle-team/drizzle-orm#0.45.2`

## Security posture

Developers working with Drizzle ORM must assume responsibility for robust input validation, query parameterization, and explicit database boundary isolation. While the ORM secures standard inputs and query structures by default through template tags and built-in parameter binding, surfaces involving raw SQL escape hatches, dynamic identifiers, multi-tenant access policies, and driver-specific transactions remain highly security sensitive. Mistakes in access control, connection management, or transaction handling should fail closed to prevent data leaks, injection vulnerabilities, and connection pool exhaustion.

## Essential implementation rules

1. **Enable Row-Level Security and Forward User Context**

Enable RLS using `.enableRLS()` and define strict table policies with `pgPolicy()` or `crudPolicy()`. Forward per-request authentication tokens via `db.$withAuth(token)` or execute prepared query methods under the correct user context to enforce multi-tenant data isolation.

2. **Configure Secure View Invocation Options**

Explicitly set view security options using `.with({ securityInvoker: true, securityBarrier: true })` or `.sqlSecurity('invoker')` so database views execute with the calling user's permissions and prevent side-channel leaks.

3. **Respect Driver Transaction Limitations**

Avoid invoking interactive transactions via `db.transaction()` on drivers that lack transaction support, such as `neon-http` or MySQL Proxy session drivers, as they throw runtime errors. Utilize `db.batch()` or non-transactional queries instead.

4. **Incorporate Tenant Identifiers in Query Caching**

Include tenant and user identifiers in custom cache tags when configuring query caching, and ensure `autoInvalidate` is set to `true` to clear cache entries correctly on data mutation operations and prevent cross-tenant data exposure.

5. **Parameterize Dynamic Queries with Template Tags**

Always use Drizzle's `sql` template literal tag for custom SQL expressions and dynamic values to ensure safe parameterization by the ORM. Never pass untrusted input or string interpolation to `sql.raw()` or `db.execute()`.

6. **Validate Dynamic Identifiers Against an Allow-List**

Before passing dynamic table, column, or schema names to `sql.identifier()`, strictly validate the untrusted identifier against a finite allow-list of expected names to block identifier injection.

7. **Use Built-In Parameter Binding for Inserts and Proxy Drivers**

Pass plain JavaScript literal values or dedicated parameter arrays to `.values()` and low-level session methods. When forwarding queries through HTTP proxy drivers, keep `sql` and `params` arguments strictly separate without string interpolation.

8. **Validate Request Payloads and Snapshots with Zod Schemas**

Derive Zod validation schemas from table definitions using `createInsertSchema()` or parse incoming JSON payloads, configuration inputs, and database schema snapshots using strict safe parsing methods like `.parse()` or `safeParse()` before processing.

9. **Manage Transaction Wrappers and Rollback Errors Safely**

Always wrap multi-statement operations in `db.transaction()` and properly await transaction callbacks to guarantee pool connections are released and prevent connection exhaustion. Do not swallow `TransactionRollbackError` or block `tx.rollback()` signals inside custom try/catch blocks.

10. **Secure Connection Strings and Redact Sensitive Logs**

Store database connection strings in environment variables like `DATABASE_URL` rather than hardcoding credentials. Implement a custom `Logger` using `logQuery(query, params)` to detect and mask sensitive fields, tokens, or passwords before writing to logs.
