# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`

## Category: access control

### Enforce explicit query filters and field permissions to prevent unauthorized access

**Use when**

Use when querying, updating, or deleting records to ensure that unauthorized actors cannot bypass soft-delete boundaries, expose sensitive fields, or execute unconstrained destructive queries.

**Secure rules**

**Rule 1: Avoid using Unscoped in standard user-facing workflows**

Do not call `Unscoped()` in standard request handlers as it bypasses soft-delete constraints and can expose deleted or revoked resources. Use `Unscoped()` strictly in administrative workflows that require access to archived data.

```go
var user User
if err := db.Where("id = ?", userID).First(&user).Error; err != nil {
    // Handle error or record not found
}
```

**Rule 2: Configure field permission struct tags to restrict model access**

Define field-level permissions using GORM struct tags such as `gorm:"->"`, `gorm:"<-:create"`, and `gorm:"-"` to explicitly enforce read and write permissions on models and prevent unauthorized field updates or exposures.

```go
type UserProfile struct {
    ID        uint   `gorm:"primaryKey"`              // Read and write enabled by default
    Internal  string `gorm:"-"`                        // Completely ignored by GORM
    ReadOnly  string `gorm:"->"`                       // Read-only; creates and updates are ignored
    CreatedAt string `gorm:"<-:create"`                // Writeable on create only; updates ignored
    UpdateOnly string `gorm:"<-:update"`               // Writeable on update only; creates ignored
    WriteOnly string `gorm:"->:false;<-:create,update"` // Write-only; reads are ignored
}
```

**Rule 3: Require explicit WHERE conditions on delete queries**

Supply explicit WHERE clauses or primary key values when performing delete operations to prevent accidental mass data deletion across database tables or unauthorized record destruction.

```go
db.Where("id = ? AND tenant_id = ?", targetID, tenantID).Delete(&User{})
```


## Category: api contract misuse

### Check RowsAffected and ErrRecordNotFound after scanning query results

**Use when**

When executing row scans with GORM's `Scan` API and utilizing the returned results in authorization, authentication, or business logic.

**Secure rules**

**Rule 1: Verify both database errors and row counts after executing a scan query.**

Always check `db.Error` using `errors.Is(err, gorm.ErrRecordNotFound)` and verify that `db.RowsAffected > 0` before trusting destination structs or maps in your application logic. When zero rows match the query, `db.RowsAffected` remains 0 and GORM will not add `gorm.ErrRecordNotFound` to `db.Error` unless explicitly configured, risking the use of uninitialized or zero-valued structures.

```go
var user User
result := db.Table("users").Where("id = ? AND active = ?", userID, true).Scan(&user)
if result.Error != nil {
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        return nil, errors.New("user not found")
    }
    return nil, result.Error
}
if result.RowsAffected == 0 {
    return nil, errors.New("user not found")
}
```


## Category: boundary control

### Enforce boundary checks on association field mutability during data persistence

**Use when**

Persisting structs with relationships such as `BelongsTo`, `HasOne`, `HasMany`, or `Many2Many` using untrusted input.

**Secure rules**

**Rule 1: Restrict association field mutability by explicitly specifying select or omit clauses.**

When saving user-provided struct data, developers must enforce strict boundary control by explicitly utilizing `Select` or `Omit` clauses to limit which associated models and nested fields are processed. Avoid executing persistence operations with global full-save behaviors on structs containing untrusted nested fields.

```go
// Safe: Explicitly omit association saves when updating parent model
db.Omit(clause.Associations).Save(&user)

// Safe: Explicitly limit persistence to specific association fields
db.Select("Profile.Bio").Save(&user)
```


## Category: deserialization

### Safely Handle Dynamic Database Types in Custom Serializers

**Use when**

When implementing custom field serializers using `schema.RegisterSerializer` or custom `Scanner` types where database values are received as empty interfaces.

**Secure rules**

**Rule 1: Explicitly type-switch across expected driver types and return an error for unexpected types when scanning database values.**

When writing custom field deserializers, avoid unchecked type assertions on values provided by database drivers. Use an explicit type switch to handle types such as `[]byte` and `string`, and return an error when an unexpected type is encountered to prevent runtime panics and application crashes.

```go
type CustomSerializer struct {
	prefix string
}

func (c *CustomSerializer) Scan(ctx context.Context, field *schema.Field, dst reflect.Value, dbValue interface{}) error {
	switch v := dbValue.(type) {
	case []byte:
		return field.Set(ctx, dst, strings.TrimPrefix(string(v), c.prefix))
	case string:
		return field.Set(ctx, dst, strings.TrimPrefix(v, c.prefix))
	default:
		return fmt.Errorf("unsupported database value type %T", dbValue)
	}
}
```


## Category: escape hatch

### Avoid Disabling Identifier Escaping on Untrusted Table and Column Names

**Use when**

When constructing database queries dynamically where table or column names might be influenced by user input.

**Secure rules**

**Rule 1: Do not set `Raw: true` on `clause.Column` or `clause.Table` structs when using dynamic or untrusted identifier names.**

Keep `Raw` set to `false` so that GORM automatically quotes identifiers. Disabling identifier escaping allows attackers to inject malicious SQL fragments into query structures since database drivers do not support standard positional parameter binding for table or column names.

```go
col := clause.Column{
	Table: "users",
	Name:  "email",
	Raw:   false,
}
```


## Category: injection

### Parameterize Dynamic Query Clauses and Expressions in GORM

**Use when**

When building query clauses, raw statements, custom valuers, associations, or joins where dynamic or untrusted input is included in database operations.

**Secure rules**

**Rule 1: Use parameter placeholders for untrusted input in query conditions.**

Always pass untrusted user input using parameterized placeholders such as `?` or named parameters in GORM query methods like `Where` to prevent SQL injection.

```go
var user User
userInput := "jinzhu; delete * from users"
if err := db.Where("name = ?", userInput).First(&user).Error; err != nil {
    // handle error
}
```

**Rule 2: Use parameter placeholders when building raw SQL expressions**

When constructing custom SQL expressions with `clause.Expr` or `clause.NamedExpr`, always use parameter placeholders in the SQL string and pass user inputs separately via the Vars slice or named arguments.

```go
expr := clause.Expr{
    SQL:  "role = ? AND status = ?",
    Vars: []interface{}{userRole, userStatus},
}
```

**Rule 3: Use parameterized placeholders for untrusted inputs in Where Conditions**

Never concatenate untrusted user input directly into query strings. Use `?` placeholders and pass user inputs as separate arguments.

```go
db.Where("username = ? AND status = ?", userInput, "active")
```

**Rule 4: Parameterize raw JOIN clauses to prevent SQL injection**

When constructing custom JOIN clauses with user-supplied parameters, pass raw SQL fragments using parameter placeholders or named arguments instead of string concatenation.

```go
DB.Joins("INNER JOIN pets ON pets.user_id = users.id AND pets.name = ?", userInputName).
	Where("users.name = ?", username).
	Find(&users)
```


## Category: input contract definition

### Restrict Mass Assignment and Associations During Record Creation

**Use when**

When creating database records from user-controlled input structs or maps to enforce input structure and field boundaries.

**Secure rules**

**Rule 1: Explicitly whitelist allowed fields or exclude sensitive associations using `DB.Select` or `DB.Omit` during record creation.**

Use `DB.Select` to specify allowed input fields for insertion, or use `DB.Omit` with `clause.Associations` to prevent the persistence of unintended nested relationships and mass assignment vulnerabilities.

```go
user := User{Name: "Alice", Account: untrustedAccount}

// Prevent creating or cascading into associated models
if err := db.Omit(clause.Associations).Create(&user).Error; err != nil {
    // handle error
}

// Alternatively, whitelist specific fields for insertion
if err := db.Select("Name", "Age").Create(&user).Error; err != nil {
    // handle error
}
```


## Category: resource exhaustion

### Enforce Query Timeouts and Resource Limits in GORM Sessions

**Use when**

Configuring GORM database instances and executing queries that require bounds on execution time or connection duration.

**Secure rules**

**Rule 1: Configure default execution timeouts and statement cache bounds on GORM configuration.**

Set `DefaultContextTimeout`, `PrepareStmtMaxSize`, and `PrepareStmtTTL` in `gorm.Config` to ensure all queries execute within bounded resource limits and prevent unbounded memory growth.

```go
db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{
    PrepareStmt:        true,
    PrepareStmtMaxSize: 1000,
    PrepareStmtTTL:     30 * time.Minute,
    DefaultContextTimeout: 5 * time.Second,
})
```

**Rule 2: Pass explicit context timeouts to query sessions.**

Use `.WithContext(ctx)` with a timeout deadline when executing queries to prevent operations from hanging indefinitely under network outages or lock contention.

```go
ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
defer cancel()

var user User
if err := db.WithContext(ctx).First(&user, id).Error; err != nil {
    // handle error or context timeout
}
```


## Category: secret handling

### Redact Sensitive Query Parameters in Logs

**Use when**

When configuring GORM loggers or implementing custom loggers to prevent the exposure of secrets, tokens, and personal data in query execution logs.

**Secure rules**

**Rule 1: Enable ParameterizedQueries in logger configuration to suppress raw parameter values.**

Set `ParameterizedQueries` to true within `logger.Config` when initializing standard or slog loggers to omit raw query values from execution logs and prevent sensitive data exposure.

```go
customLogger := logger.New(
	log.New(os.Stdout, "\r\n", log.LstdFlags),
	logger.Config{
		SlowThreshold:             200 * time.Millisecond,
		LogLevel:                  logger.Warn,
		ParameterizedQueries:      true,
		IgnoreRecordNotFoundError: true,
	},
)

db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{
	Logger: customLogger,
})
```

**Rule 2: Implement the ParamsFilter interface to sanitize parameters in custom loggers.**

Implement the `ParamsFilter` interface on custom logger types or filtering structs to inspect and redact sensitive parameter values prior to downstream execution or logging.

```go
type SensitiveFilter struct{}

func (f SensitiveFilter) ParamsFilter(ctx context.Context, sql string, params ...interface{}) (string, []interface{}) {
	sanitizedParams := make([]interface{}, len(params))
	for i, p := range params {
		if isSensitiveField(p) {
			sanitizedParams[i] = "[REDACTED]"
		} else {
			sanitizedParams[i] = p
		}
	}
	return sql, sanitizedParams
}
```


## Category: security control integrity

### Prevent Security Control Bypass by Ensuring Lifecycle Hooks Remain Active

**Use when**

Use when performing model updates, deletions, or session configurations where lifecycle hooks enforce critical security validations, audit logging, or field transformations.

**Secure rules**

**Rule 1: Avoid setting SkipHooks to true or using direct update methods that bypass model hooks when hooks contain mandatory security controls.**

Ensure that `SkipHooks` remains false and avoid using `UpdateColumn` or `UpdateColumns` if your model lifecycle hooks handle access control, input validation, or cryptographic hashing. Use `Update` or `Updates` to ensure registered hooks execute properly.

```go
tx := db.Session(&gorm.Session{
    SkipHooks: false,
})
tx.Create(&user)
```
