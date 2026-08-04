# Security blueprint

Repository: `https://github.com/typeorm/typeorm#1.1.0`

## Security posture

When developing applications with TypeORM, engineers must assume responsibility for input parameterization, authentication mechanisms, and explicit schema lifecycle management. While the library prevents basic SQL injection through parameter bindings and query builder abstractions, developers must actively secure dynamic identifiers, handle connection secrets safely, and enforce strict isolation settings. Any misuse of raw SQL escape hatches, unvalidated input criteria, or disabled synchronization defaults should fail closed and be rejected during code review.

## Essential implementation rules

1. **Always bind dynamic or untrusted user input using named or positional parameter placeholders**

Concatenating untrusted variables directly into database query strings allows attackers to manipulate SQL commands and execute arbitrary queries. Always pass dynamic values through parameter bindings or repository search criteria options to ensure TypeORM safely parameterizes and escapes the inputs.

2. **Validate dynamic SQL identifiers before raw interpolation in the `sql` tag**

When you embed a table, schema, or column name in a TypeORM `sql` tagged template by returning a string from a function expression, that string is inserted into the query without any escaping or parameterization. Never pass user-controlled values here. Instead, verify the identifier against a strict allow-list before inserting it.

3. **Never pass function callbacks or user-influenced functions as parameter values in query parameter maps**

Several database drivers execute parameter values defined as functions and concatenate their string returns directly into the SQL statement without parameterization or escaping. Always supply primitive scalar values, dates, or arrays directly in query parameter maps.

4. **Ensure automatic schema synchronization is disabled in production environments**

Set `synchronize: false` in production environments when initializing `DataSource` to prevent unintended database table drops or column alterations. Rely on managed database migrations instead of automatic schema synchronization.

5. **Load database credentials, authentication secrets, and encryption keys dynamically from environment variables**

Do not embed passwords, usernames, TLS private keys, connection strings, or encryption keys directly into source code or static configuration files. Supply these secrets dynamically at runtime using process environment variables or use Azure AD authentication mechanisms for SQL Server connections.

6. **Explicitly exclude sensitive columns from standard query selections and properly encode connection credentials**

Set `{ select: false }` on entity columns storing sensitive information like passwords or tokens to prevent them from being queried by default. Additionally, percent-encode credential components when constructing database connection URL strings.

7. **Ensure `serializeFunctions` remains false in MongoDB `DataSource` options**

Set `serializeFunctions` explicitly to `false` in your MongoDB `DataSource` configuration to prevent functions attached to objects from being encoded into BSON and stored in the database, thereby avoiding subsequent remote code execution or function injection risks.

8. **Enforce input contract validation on entity properties before executing database persistence operations**

Annotate entity properties with validation constraints using decorators and explicitly call `validate()` on the entity instance to reject malformed or out-of-contract data prior to calling save methods on the DataSource, EntityManager, or Repository.

9. **Explicitly route security-critical read queries to the master node**

When using database replication, TypeORM routes read queries to random slave nodes by default. For queries that perform access control checks or rely on recently written state, instantiate a query runner targeting the master explicitly or configure the default mode to master to ensure trust transition checks evaluate against up-to-date state.

10. **Execute pessimistic query builder locks inside database transactions**

When executing queries with pessimistic locks using `QueryBuilder.setLock()`, TypeORM requires an active database transaction. Always execute locked queries using the transactional EntityManager inside `dataSource.manager.transaction()` and always use the provided transactional entity manager within transaction callbacks.

11. **Set query execution timeouts within the driver options to limit query duration**

Enable query timeouts by setting `enableQueryTimeout` to true and specifying a `maxQueryExecutionTime` limit in milliseconds within your `DataSource` driver options. This bounds query duration and mitigates connection pool starvation from unbounded operations.
