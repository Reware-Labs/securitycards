# Security blueprint

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`

## Security posture

When developing applications with SQLAlchemy, developers must assume that database queries, schema definitions, and connection credentials require strict explicit configuration to prevent injection, unauthorized data access, and resource exhaustion. While the framework protects against standard SQL injection when using built-in expression constructs and parameterized queries, it does not automatically enforce tenant isolation, handle result consumption correctly for joined collections, or sanitize unverified raw SQL and dynamic identifiers. Security-sensitive surfaces include raw SQL escape hatches, connection URL construction, event listeners, and custom mutation types, all of which must fail closed when encountering untrusted inputs or misconfigurations.

## Essential implementation rules

1. **Enforce Tenant Isolation and Row-Level Access at the Query Level**

Pass `with_loader_criteria()` options at the top-level query or within `do_orm_execute` event handlers rather than nesting filters inside relationship load option chains, which raises an `ArgumentError`.

2. **Invoke Unique and Handle Result Options Correctly on Queries**

Explicitly call `.unique()` on query results when using `joinedload()` against collection relationships, and use `AsyncSession.stream()` or `AsyncSession.stream_scalars()` instead of `execute()` when handling server-side cursors.

3. **Verify Parameters and Event Context in Interceptors and Load Listeners**

Preserve executemany cardinality by supplying exactly one override dictionary for each original parameter when using `ORMExecuteState.invoke_statement()`, and set `restore_load_context=True` when registering instance load listeners that perform database access.

4. **Configure Dynamic Azure AD Token Authentication Securely**

Register a `do_connect` event listener to strip default `Trusted_Connection=Yes` parameters and attach proper Azure AD token structures to `cparams['attrs_before']` when connecting to Microsoft SQL Server with dynamic tokens.

5. **Sanitize PostgreSQL Search Path During Metadata Reflection**

Explicitly specify target schemas and set `postgresql_ignore_search_path=True` during metadata reflection to prevent foreign keys and reflected tables from binding to unintended schemas.

6. **Pin Oracle Identifier Length for Legacy Compatibility**

Set `max_identifier_length=30` when connecting to Oracle Database 12.2 or later if you must preserve constraint and index names previously generated under legacy limits.

7. **Configure Robust Encryption and Key Derivation Parameters**

Supply necessary parameters such as `kdf_iter`, `cipher`, and `cipher_use_hmac` through the connection URL when initializing encrypted databases like SQLCipher to protect against offline brute-force attacks.

8. **Avoid Python Pickle Deserialization for Untrusted Data**

Do not use `PickleType` or `sqlalchemy.ext.serializer.loads` with untrusted data inputs, as pickle allows arbitrary code execution; use safe data formats like `JSON` instead.

9. **Use Parameterized Queries and Expressions with Raw SQL Escape Hatches**

Avoid concatenating or formatting untrusted user input directly into raw SQL escape hatch functions like `text()` and `literal_column()`; use named bind parameter placeholders and supply values via parameter dictionaries.

10. **Safely Quote Identifiers and Construct DDL Schema Objects**

When creating database schema objects from external strings, ensure identifiers are quoted by setting `quote=True` or wrapping them with `quoted_name(name, quote=True)` rather than using string formatting for DDL definitions.

11. **Enforce Input Coercion and Type Validation in Custom Mutable ORM Types**

Override `coerce()` in custom mutable types to validate incoming data structures, delegate unsupported values to `Mutable.coerce()` to raise a `ValueError`, and call `changed()` on every in-place mutation method.

12. **Constrain Shard Selection with Explicit Shard Boundaries**

Attach `set_shard_id` with `propagate_to_loaders=True` to statements using `.options()` to lock execution and lazy-loader propagation to a single target shard backend.

13. **Use URL Create for Safe Connection String Construction**

Use `URL.create()` when constructing database URLs from individual components to bypass string-URL parsing and securely handle special characters in usernames and passwords.

14. **Prevent Host Redirection in PostgreSQL Connection URLs**

For `postgresql+psycopg2` URLs, specify a single intended connection host using `URL.create()` and omit `host` from query mappings to prevent SQLAlchemy from silently discarding authority hosts.

15. **Stream Large Query Result Sets and Optimize Collection Loading**

Stream large datasets using `yield_per()` paired with `selectinload()` for related collections, and configure `raiseload` on relationship attributes to prevent N+1 query cascades and memory exhaustion.

16. **Load Database Credentials and Passphrases from Secure Sources**

Retrieve sensitive database credentials and passphrases from environment variables or secret managers, and pass them unchanged to `URL.create()` rather than interpolating them into URL strings.

17. **Keep SQL-Shape Conditionals Outside Cached Lambda Bodies**

Evaluate branching conditions with ordinary Python control flow outside of `lambda_stmt()` definitions and attach a separate lambda for each distinct SQL structure.

18. **Explicitly Remove Scoped Sessions to Prevent State Leakage**

Invoke `scoped_session.remove()` or `await scoped_session.remove()` at the end of each request or task context to clear uncommitted transactional state and cached identity map data.
