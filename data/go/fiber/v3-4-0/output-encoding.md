# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: output encoding

## output encoding

### URL encode untrusted query parameters when configuring route redirects

**Use when**

When populating `RedirectConfig.Queries` with untrusted data for `c.Redirect().Route()` in Fiber applications.

**Secure rules**

**Rule 1: URL-encode untrusted parameter keys and values using `url.QueryEscape` before inserting them into redirect query configurations.**

Because Fiber appends query map keys and values directly without automatic URL escaping for performance reasons, developers must manually encode untrusted data using `url.QueryEscape` to prevent HTTP parameter injection or malformed URL structures.

```go
app.Get("/search-redirect", func(c fiber.Ctx) error {
    query := c.Query("q")
    return c.Redirect().Route("search.results", fiber.RedirectConfig{
        Queries: map[string]string{
            "q": url.QueryEscape(query),
        },
    })
})
```
