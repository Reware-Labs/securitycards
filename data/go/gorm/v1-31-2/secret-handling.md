# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: secret handling

## secret handling

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
