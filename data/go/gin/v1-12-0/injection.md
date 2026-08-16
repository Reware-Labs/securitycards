# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: injection

## injection

### Bind untrusted values into SQL statements as placeholders

**Use when**

Building a SQL query where any part of the statement comes from a bound struct field, path parameter, or query parameter.

**Secure rules**

**Rule 1: Pass request values as placeholder arguments, never as query text.**

Gin's binders check that a field is present and well typed, but a validated `string` is still arbitrary text. Building the statement with `fmt.Sprintf` or `+` lets a value such as `admin'--` change what it means. Give the query placeholders — `?` for MySQL and SQLite, `$1` for PostgreSQL — and pass the values as trailing arguments. Placeholders bind values only, not table or column names.

```go
type LoginRequest struct {
    Email string `json:"email" binding:"required,email"`
}

router.POST("/login", func(c *gin.Context) {
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
        return
    }
    var id int
    var hash string
    err := db.QueryRow(
        "SELECT id, password_hash FROM users WHERE email = ?", req.Email,
    ).Scan(&id, &hash)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"id": id})
})
```

**Rule 2: Map identifiers through a lookup defined in code when a placeholder cannot be used.**

Column names and sort directions are part of the statement's syntax, so the driver will not bind them. Translate the request value through a map or a `binding:"oneof=..."` tag and interpolate the resulting constant, which holds no caller-controlled text. Quoting or escaping the raw value instead is fragile and varies by database.

```go
var sortColumns = map[string]string{"name": "name", "created": "created_at"}

type ListQuery struct {
    SortBy string `form:"sort_by" binding:"omitempty,oneof=name created"`
}

router.GET("/products", func(c *gin.Context) {
    var q ListQuery
    if err := c.ShouldBindQuery(&q); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sort"})
        return
    }
    column, ok := sortColumns[q.SortBy]
    if !ok {
        column = "name"
    }
    rows, err := db.Query(
        fmt.Sprintf("SELECT id, name FROM products ORDER BY %s LIMIT ?", column), 100,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "query failed"})
        return
    }
    defer rows.Close()
    // ... scan rows
})
```


### Invoke external programs as argument slices without a shell

**Use when**

Running an external tool where any argument comes from request data, such as a filename, URL, or hostname.

**Secure rules**

**Rule 1: Build commands with `exec.Command(name, args...)`, not a shell string.**

`exec.Command` executes the named binary directly, so `;`, `|`, backticks, and `$(...)` inside an argument are ordinary characters. Routing the same work through `exec.Command("sh", "-c", line)` reintroduces the interpreter, and a filename such as `report.pdf; rm -rf /var/data` then runs a second command. Where a pipeline is genuinely needed, connect two `exec.Cmd` values through `StdoutPipe`.

```go
router.POST("/convert", func(c *gin.Context) {
    source := c.PostForm("source")
    target := c.PostForm("target")

    cmd := exec.Command("convert", source, target) // separate arguments
    if err := cmd.Run(); err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "conversion failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"output": target})
})
```

**Rule 2: Stop request-derived arguments from being read as options.**

Without a shell there is still the program's own flag parser: an argument beginning with `-` becomes an option and can redirect output or enable an unintended mode. Rejecting leading dashes is the guard that always works, so make that the check you rely on. `--` is a widely followed convention rather than a guaranteed one: `getopt`-based tools honour it, but `g++` and `gcc` reject it outright with `unrecognized command-line option '--'`, so adding it to a compiler invocation breaks a command that was working. Pass `--` only to a program documented to accept it, and keep your own flags ahead of it, since many tools are order-sensitive.

```go
router.GET("/reachability", func(c *gin.Context) {
    host := c.Query("host")
    if strings.HasPrefix(host, "-") {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid host"})
        return
    }
    cmd := exec.Command("ping", "-c", "1", "--", host) // our flags, then user data
    if err := cmd.Run(); err != nil {
        c.JSON(http.StatusOK, gin.H{"reachable": false})
        return
    }
    c.JSON(http.StatusOK, gin.H{"reachable": true})
})
```
