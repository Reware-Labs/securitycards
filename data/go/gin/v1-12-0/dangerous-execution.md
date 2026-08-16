# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: dangerous execution

## dangerous execution

### Parse templates from your own files, never from request data

**Use when**

A handler renders a template, or accepts template text, a formula, or another expression from the caller.

**Secure rules**

**Rule 1: Parse templates from your own files and pass request data in only as data.**

`template.New("t").Parse(userInput)` compiles the caller's text into an executable template. Template actions traverse whatever you pass to `Execute` and can call exported methods on it, so a caller controlling the body reads that data. `text/template` also applies no escaping, making its output unsafe in an HTML response. Load templates once at startup with `router.LoadHTMLGlob` and let `c.HTML` supply untrusted values as the data argument, where `html/template` escapes them per context.

```go
router := gin.Default()
router.LoadHTMLGlob("templates/*.tmpl") // authored by us, parsed once at startup

router.GET("/profile/:name", func(c *gin.Context) {
    // The caller controls the value, never the template body.
    c.HTML(http.StatusOK, "profile.tmpl", gin.H{"name": c.Param("name")})
})
```
