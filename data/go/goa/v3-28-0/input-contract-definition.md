# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: input contract definition

## input contract definition

### Enforce Strict Input Validation and Schema Constraints in Goa DSL

**Use when**

Defining API service payloads, parameters, headers, cookies, or agent tool arguments using Goa's design DSL to reject malformed or out-of-contract inputs before processing.

**Secure rules**

**Rule 1: Define explicit validation constraints and primitive formats on attributes using Goa DSL validation primitives.**

Use validation functions such as Pattern, MinLength, MaxLength, Format, Minimum, Maximum, Enum, and Required within your Goa DSL definitions to ensure transport layers automatically enforce strict input boundaries and reject invalid or unbounded data.

```go
var UserProfile = Type("UserProfile", func() {
    Attribute("username", String, func() {
        Pattern("^[a-z0-9]+$")
        MinLength(3)
        MaxLength(50)
    })
    Attribute("email", String, func() {
        Format(FormatEmail)
    })
    Attribute("role", String, func() {
        Enum("admin", "user", "guest")
    })
    Required("username", "email", "role")
})
```

**Rule 2: Declare mandatory attributes explicitly as required or pointer types to prevent zero-value defaults.**

Because Go primitive types cannot be nil, explicitly include mandatory fields inside the Required DSL expression so Goa's validation generator prevents missing inputs from silently falling back to zero values.

```go
var CreateUserPayload = Type("CreateUserPayload", func() {
    Attribute("user_id", String, "User identifier")
    Attribute("account_id", String, "Account identifier")
    Required("user_id", "account_id")
})
```
