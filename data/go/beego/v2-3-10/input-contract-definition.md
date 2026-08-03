# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: input contract definition

## input contract definition

### Validate Untrusted Struct Inputs Using Beego Validation Rules

**Use when**

When validating untrusted incoming request data and struct objects against strict type, range, and format rules before processing them in application logic.

**Secure rules**

**Rule 1: Enforce strict validation rules on struct fields using validation tags and inspect return error values before processing input data.**

Use Beego's validation package to apply validation struct tags such as `Required`, `Range`, `MaxSize`, `Match`, `Email`, and `IP` on struct fields or direct variables. Always check return values from `valid.Valid(struct)` or `valid.HasErrors()` and halt execution if validation fails.

```go
type User struct {
	Name string `valid:"Required;MaxSize(15)"`
	Age  int    `valid:"Required;Range(1, 140)"`
}

func processUser(u User) {
	valid := validation.Validation{}
	b, err := valid.Valid(&u)
	if err != nil {
		return
	}
	if !b {
		for _, err := range valid.Errors {
			log.Println(err.Key, err.Message)
		}
		return
	}
}
```

**Rule 2: Inspect boolean return values and error states when evaluating nested struct fields with recursive validation.**

Always inspect the boolean return value and `v.HasErrors()` after calling `v.Valid()` or `v.RecursiveValid()`. Use `v.RecursiveValid()` when handling untrusted incoming structs that contain nested struct fields, as standard `v.Valid()` only evaluates top-level struct fields.

```go
type Profile struct {
    Email string `valid:"Required;Email"`
}

type UserInput struct {
    Name    string  `valid:"Required;MaxSize(50)"`
    Profile Profile
}

func HandleInput(input UserInput) {
    valid := validation.Validation{}
    pass, err := valid.RecursiveValid(&input)
    if err != nil || !pass {
        for _, err := range valid.Errors {
            log.Printf("Validation error on field %s: %s", err.Field, err.Message)
        }
        return
    }
}
```

**Rule 3: Configure required-first validation for optional struct fields to prevent unexpected validation rejections.**

When using Beego's struct tag validation with `validation.Validation`, optional empty fields will fail format rules unless `RequiredFirst: true` is configured on the `Validation` instance. Developers must explicitly set `Validation{RequiredFirst: true}` to ensure optional fields do not fail validation when omitted.

```go
type User struct {
	ReqEmail string `valid:"Required;Email"`
	Email    string `valid:"Email"`
}

valid := validation.Validation{RequiredFirst: true}
ok, err := valid.Valid(u)
if err != nil || !ok {
	return
}
```

**Rule 4: Target cross-platform integer types for numerical range validations.**

When configuring struct tag parameters for validators on 32-bit architectures, ensure numerical bounds do not rely on int64 values. The parseParam helper returns an error on 32-bit platforms when encountering int64 parameter types, so target standard int or int32 for range validations.

```go
type UserInput struct {
    Quantity int `valid:"Min(1); Max(1000)"`
}
```

**Rule 5: Apply custom pattern matching for global or international input formats instead of region-specific built-in validators.**

Beego validators like Mobile, Tel, Phone, and ZipCode hardcode regular expressions designed exclusively for Chinese phone numbers and postal codes. Use custom pattern matching or dedicated validation packages when validating international input to prevent legitimate values from being rejected.

```go
var intlPhoneRegex = regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)

valid.Match(userPhone, intlPhoneRegex, "Phone").Message("Invalid international phone number")
```
