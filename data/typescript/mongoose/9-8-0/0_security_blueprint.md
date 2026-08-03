# Security blueprint

Repository: `https://github.com/automattic/mongoose#9.8.0`

## Security posture

Mongoose applications must assume an explicit security model where input validation, schema strictness, and query sanitization are not fully automatic across all operational paths. Developers must guard against query injection, mass assignment, and authorization bypasses by explicitly configuring strict options, runtime validators, and secure connection parameters. Security-sensitive surfaces include query construction, update pipelines, middleware hooks, and database credential management, all of which must fail closed when encountering unvalidated inputs or connection anomalies.

## Essential implementation rules

1. **Enforce Tenant Isolation and Authorization via Document Hooks**

Set document-level query filters inside `pre('save')` middleware hooks by checking `this.isNew` and assigning tenant ownership properties such as `this.$where = { tenantId: this.$locals.tenantId, isDeleted: false }` to prevent cross-tenant modifications.

2. **Manage Transaction Sessions and Atomic Array Operations Correctly**

Attach transaction sessions explicitly using `.session(session)` or passing `{ session }` in options, or enable `transactionAsyncLocalStorage`. When working with partial array projections like `$slice`, use atomic methods such as `.push()` or update operators like `$push` to avoid `DivergentArrayError` exceptions.

3. **Configure Explicit Connection Credentials and Secure Network Options**

Define authentication sources and credentials using environment variables, and set `authSource` explicitly when user credentials belong to a different database. Enable TLS with certificate validation in production and avoid `tlsAllowInvalidCertificates` or `tlsInsecure`.

4. **Specify Target Scope for Deletion Middleware and Lifecycle Hooks**

Explicitly configure hook targets with `{ query: true, document: true }` when implementing deletion middleware or cascading security cleanups to ensure boundary checks apply equally to document instances and static model queries.

5. **Configure Client-Side Field-Level Encryption and Schema Options**

Declare cryptographic parameters like `keyId` and algorithms directly on sensitive schema paths and supply `autoEncryption` options including `kmsProviders` and `keyVaultNamespace` when opening database connections.

6. **Restrict Update Pipelines and Neutralize Query Injection**

Keep `updatePipeline` set to `false` unless input stages are strictly validated, and avoid unvalidated string concatenation or dynamic code execution in `$where` expressions. Enable `sanitizeFilter` globally or per query to wrap `$`-prefixed properties in `$eq`.

7. **Explicitly Cast Aggregation Inputs and Validate ObjectIds**

Always explicitly cast field types using `mongoose.Types.ObjectId` and sanitize user input before passing it into aggregation pipelines. Use `mongoose.isObjectIdOrHexString()` for strict ObjectId input validation rather than relying on looser coercion checks.

8. **Configure Schema Strictness and Validation Boundaries**

Configure `strict: 'throw'` and `strictRead: 'throw'` to reject unknown fields and prevent mass assignment. Define explicit validation boundaries including required fields, string enums, regular expressions, and numeric limits on all schemas.

9. **Constrain Dynamic Model Lookups with Schema Enums**

When using dynamic document references via `refPath`, always constrain the discriminator field in the schema using an `enum` validator to prevent attackers from querying or populating arbitrary models.

10. **Set Global Execution Timeouts and Disable Command Buffering**

Configure a global `maxTimeMS` timeout on all queries to enforce execution limits, and set `bufferCommands: false` during connection creation to prevent operations from hanging indefinitely during database outages.

11. **Exclude Sensitive Fields from Default Projections**

Set `select: false` on schema paths storing sensitive data like password hashes, API keys, or session tokens to exclude them by default from query projections.

12. **Enable Update Validators and Maintain Security Control Integrity**

Set `runValidators: true` or enable `mongoose.set('runValidators', true)` when executing update methods like `updateOne()` or `findOneAndUpdate()`, keeping in mind that update validators run only on included paths and supported operators.

13. **Preserve Middleware Execution and State Across Writes**

Keep `validateBeforeSave` enabled, use `Model.create()` when every inserted document must run `save()` middleware and validation instead of raw bulk writes, and store custom metadata in `doc.$locals` for safe state transfer between middleware hooks.
