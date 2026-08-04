# Security blueprint

Repository: `https://github.com/prisma/prisma#7.8.0`

## Security posture

Prisma 7.8.0 requires a security-first approach to data access, configuration, and transaction lifecycle management. While it provides type-safe query building to mitigate standard SQL injection risks, it does not implicitly enforce multi-tenant data isolation or granular access control logic, which must be implemented at the application layer. Developers must configure datasource URLs and environment-based secrets explicitly, use transaction-specific clients for operations inside interactive transactions, and apply robust pagination and authorization checks.

## Essential implementation rules

1. **Enforce Tenant Isolation and Ownership at the Query Level**

Scope each owner-restricted operation with a `where` clause containing the authenticated user's ownership identifier, and enforce authentication and authorization in application logic. Use tenant-specific Prisma Client query extensions where appropriate, ensure application code uses the correctly scoped client, and use non-nullable ownership fields such as `authorId` when every record must have an owner.

2. **Use Transaction-Specific Clients for Atomic Operations**

Always use the `tx` instance provided within an interactive `$transaction` callback rather than the global `prisma` client. This ensures database operations execute atomically and within the intended scope to maintain data integrity and prevent partial updates.

3. **Secure Database Connections via Driver Adapters**

Instantiate `PrismaClient` with the required Driver Adapter and explicitly pass a validated, secret-managed connection URL. For adapters such as `PrismaNeonHttp`, provide the adapter's database connection string through the designated environment variable.

4. **Prevent SQL Injection in Raw Queries**

Avoid concatenating dynamic input into raw SQL strings. Use Prisma's tagged template literals for `$queryRaw` and `$executeRaw` to automatically parameterize inputs and prevent command injection.

5. **Load Configuration Secrets Explicitly**

Prisma 7.x does not auto-load `.env` files. Explicitly load environment variables, for example by importing `dotenv/config`, before accessing required database credentials from `prisma.config.ts`.

6. **Manage Resource Consumption with Pagination**

Mitigate resource exhaustion by implementing pagination with `take` and `skip`, or cursor-based pagination for large result sets. Limit nested `include` or `select` depth and breadth to prevent complex and expensive queries.

7. **Ensure Cryptographic Integrity in Polyfilled Environments**

When using `globalThis.crypto` compatibility helpers, always `await` asynchronous operations like `digest()`. Check that the corresponding crypto API, such as `randomUUID` or `randomFillSync`, is available before invoking it.

8. **Enforce Transactional Consistency for Sensitive Logic**

Use explicit isolation levels such as `Serializable` for complex, sensitive transactions. After applying schema mutations or migrations, always run `prisma generate` to update the Prisma Client and reconcile runtime type definitions with the database schema.

9. **Do Not Infer Query-Argument Capture from the Tracing Example**

Prisma's tracing example demonstrates tracing setup, but it does not establish that query arguments are captured in spans or prescribe redacting them before a query. Do not cite that example as evidence for either behavior.

10. **Enforce Strict Environment Configuration**

Define migration paths and datasource URLs explicitly in `prisma.config.ts`, source connection strings from the intended environment rather than hardcoding credentials, and verify the selected environment before running migration commands.
