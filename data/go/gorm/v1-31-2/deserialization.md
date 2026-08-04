# Security cards

Repository: `https://github.com/go-gorm/gorm#v1.31.2`
Category: deserialization

## deserialization

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
