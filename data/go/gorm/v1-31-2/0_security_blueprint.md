# Security blueprint

Repository: `https://github.com/go-gorm/gorm#v1.31.2`

## Security posture

Developers working with gorm#v1.31.2 must assume responsibility for securing all dynamic query parameters, boundaries, and model lifecycles against unauthorized access and injection. While the framework provides parameterized query builders and struct tagging by default, it does not automatically enforce multi-tenant isolation, row-level access controls, or safe association mapping. Security-sensitive surfaces include raw SQL escape hatches, dynamic identifier construction, association persistence, and custom type deserializers, all of which must fail closed when errors occur.

## Essential implementation rules

1. **Parameterize All Untrusted Input in Queries and Raw SQL**

Always pass untrusted user input using parameterized placeholders like `?` or named arguments within `Where`, raw expressions (`clause.Expr`), and `Joins` to prevent SQL injection. Never concatenate raw strings directly into query conditions or JOIN clauses.

2. **Prevent Identifier Injection in Dynamic Table and Column Names**

Keep `Raw` set to `false` when utilizing `clause.Column` or `clause.Table` structs. Disabling identifier escaping allows attackers to inject malicious SQL fragments since database drivers do not support standard positional parameter binding for database identifiers.

3. **Verify RowsAffected and Record NotFound Errors After Scans**

Always check `db.Error` using `errors.Is(err, gorm.ErrRecordNotFound)` and verify `db.RowsAffected > 0` before trusting scanned destination structs or maps in authorization, authentication, or business logic.

4. **Enforce Strict Field Permissions and Whitelist Associations on Write**

Define field-level permissions using GORM struct tags such as `gorm:"->"`, `gorm:"<-:create"`, and `gorm:"-"` to restrict model access. During record creation and updates, explicitly whitelist allowed fields using `DB.Select` or omit nested relationships using `DB.Omit` with `clause.Associations` to prevent mass assignment.

5. **Restrict Association Mutability and Avoid Unscoped Queries in Workflows**

Control association field mutability by explicitly specifying select or omit clauses when persisting structs. Avoid calling `Unscoped()` in standard request handlers as it bypasses soft-delete constraints, and always supply explicit WHERE clauses or primary keys on delete operations to prevent mass deletion.

6. **Safely Handle Dynamic Types in Custom Serializers**

When writing custom field deserializers with `schema.RegisterSerializer` or custom `Scanner` types, avoid unchecked type assertions on database values. Use an explicit type switch across expected driver types such as `[]byte` and `string`, and return an error for unexpected types to prevent runtime panics.

7. **Enforce Query Timeouts and Resource Limits**

Configure `DefaultContextTimeout`, `PrepareStmtMaxSize`, and `PrepareStmtTTL` in `gorm.Config` to bound resource utilization. Always pass explicit context deadlines using `.WithContext(ctx)` on query sessions to prevent operations from hanging indefinitely.

8. **Redact Sensitive Parameters in Query Logs**

Enable `ParameterizedQueries` within `logger.Config` or implement the `ParamsFilter` interface on custom loggers to suppress raw parameter values and prevent secrets, tokens, and personal data from leaking into execution logs.

9. **Ensure Lifecycle Hooks Remain Active for Security Validation**

Ensure that `SkipHooks` remains false and avoid using direct update methods like `UpdateColumn` if your model lifecycle hooks handle access control, input validation, or cryptographic hashing. Use `Update` or `Updates` to guarantee registered hooks execute properly.
