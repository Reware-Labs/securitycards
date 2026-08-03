# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: output encoding

## output encoding

### Escape JSON Responses for HTML Contexts

**Use when**

When serving JSON payloads that may be embedded directly inside HTML templates or web view contexts.

**Secure rules**

**Rule 1: Use standard JSON rendering to automatically escape HTML elements and prevent injection.**

Use Gin's standard JSON rendering via `c.JSON` or `render.JSON` to ensure that characters like `<`, `>`, and `&` are automatically converted into safe Unicode escape sequences. Avoid disabling HTML escaping or using raw encoders in web contexts where output might be evaluated as script or HTML markup.

```go
c.JSON(http.StatusOK, gin.H{
    "message": "<b>Welcome</b>",
})
```
