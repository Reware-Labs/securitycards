# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: input contract definition

## input contract definition

### Validate Request Input and Enforce Input Contracts

**Use when**

Use when binding request payloads, query parameters, path variables, or form data to ensure untrusted input conforms to required types, structures, and value boundaries before executing handler logic.

**Secure rules**

**Rule 1: Register a custom validator and explicitly invoke validation after binding request data.**

Implement the `echo.Validator` interface and assign it to the Echo instance using `echo.NewWithConfig` or `e.Validator`. Because Echo does not automatically execute validation during `c.Bind(i)`, developers must explicitly call `c.Validate(i)` on bound struct pointers and catch any returned validation errors.

```go
type CustomValidator struct {
	validator *validator.Validate
}

func (cv *CustomValidator) Validate(i any) error {
	return cv.validator.Struct(i)
}

e := echo.NewWithConfig(echo.Config{
	Validator: &CustomValidator{validator: validator.New()},
})

func createUserHandler(c *echo.Context) error {
	req := new(CreateUserRequest)
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, req)
}
```

**Rule 2: Enforce typed parameter binding and mandatory input constraints.**

Use typed parameter binding helpers such as `echo.QueryParam[T](c, name)` and `QueryParamsBinder` with `Must<Type>` methods to enforce strict type constraints and required parameter presence. Always check and evaluate `BindError()` or binding error returns immediately to prevent malformed or missing parameters from silently defaulting to zero-values.

```go
var userID int64
err := echo.QueryParamsBinder(c).
    MustInt64("user_id", &userID).
    BindError()

if err != nil {
    return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid request parameters"})
}

val, err := echo.QueryParam[string](c, "key")
if err != nil {
    return echo.NewHTTPError(http.StatusBadRequest, "invalid query parameter")
}
```

**Rule 3: Use single-source binding functions to prevent request parameter override.**

Avoid default binder sequential evaluation when struct tags overlap across different request sources. Use dedicated single-source binding functions like `echo.BindPathValues`, `echo.BindQueryParams`, or `echo.BindBody` to maintain strict parameter origin boundaries.

```go
var pathData PathParams
if err := echo.BindPathValues(c, &pathData); err != nil {
    return err
}
var bodyData BodyParams
if err := echo.BindBody(c, &bodyData); err != nil {
    return err
}
```
