# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: input contract definition

## input contract definition

### Enforce strict input contracts with struct validation tags and binders

**Use when**

Handling incoming HTTP request payloads or path parameters and enforcing required fields, types, and input constraints.

**Secure rules**

**Rule 1: Use struct tags with `ShouldBind` or `ShouldBindJSON` to enforce strict input validation and handle parsing errors explicitly.**

Define explicit struct tags such as `binding:"required"` and use `ShouldBind` or `ShouldBindJSON` to ensure unvalidated request payloads are rejected before entering core application logic.

```go
type LoginRequest struct {
    User     string `json:"user" binding:"required"`
    Password string `json:"password" binding:"required"`
}

router.POST("/login", func(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // Process validated request
})
```

**Rule 2: Register custom field validation rules using `RegisterValidation` to enforce domain-specific input contracts.**

Type-assert the underlying `go-playground/validator` engine exposed by `binding.Validator.Engine()` to `*validator.Validate` and register custom validation rules to enforce specialized input constraints across bound request models.

```go
if engine, ok := binding.Validator.Engine().(*validator.Validate); ok {
    _ = engine.RegisterValidation("notone", func(fl validator.FieldLevel) bool {
        if val, ok := fl.Field().Interface().(int); ok {
            return val != 1
        }
        return false
    })
}

type UserRequest struct {
    Code int `json:"code" binding:"required,notone"`
}
```

**Rule 3: Validate URI path parameters with `BindUri` and struct validation tags.**

Use `c.BindUri()` or `c.ShouldBindUri()` along with struct validation tags to enforce strict input validation contracts on URL path parameters and automatically return HTTP 400 Bad Request when validation fails.

```go
type Member struct {
	Number string `uri:"num" binding:"required,uuid"`
}

router.GET("/members/:num", func(c *gin.Context) {
	var m Member
	if err := c.BindUri(&m); err != nil {
		// c.BindUri automatically writes HTTP 400 response on failure
		return
	}
	c.JSON(http.StatusOK, gin.H{"member": m.Number})
})
```
