# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: input interpretation safety

## input interpretation safety

### Validate and normalize custom unmarshaled string attributes and parameters

**Use when**

Implementing custom unmarshaling logic for Go types used as string attributes or HTTP path and query parameters in Goa designs.

**Secure rules**

**Rule 1: Validate formats and bounds explicitly inside custom text and format unmarshalers**

When custom Go types override generated unmarshaling via `struct:field:type` or handle HTTP parameters implementing `encoding.TextUnmarshaler`, implement strict checks to normalize inputs and reject malformed, empty, or oversized values before storing them.

```go
type CustomUUID string

func (c *CustomUUID) UnmarshalText(text []byte) error {
    if err := goa.ValidateFormat(goa.FormatUUID, string(text)); err != nil {
        return fmt.Errorf("invalid UUID: %w", err)
    }
    *c = CustomUUID(text)
    return nil
}
```
