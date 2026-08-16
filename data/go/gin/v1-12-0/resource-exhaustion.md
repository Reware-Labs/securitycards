# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: resource exhaustion

## resource exhaustion

### Limit Multipart Upload Memory Allocation

**Use when**

Processing multipart form uploads in Gin applications to prevent memory exhaustion and Denial of Service.

**Secure rules**

**Rule 1: Configure MaxMultipartMemory to limit the memory allocated during multipart form processing.**

Explicitly set `router.MaxMultipartMemory` to an appropriate size limit to prevent concurrent large uploads from exhausting server RAM and causing a Denial of Service. Values can be assigned in bytes, such as using byte shift operations for readability.

```go
router := gin.Default()
router.MaxMultipartMemory = 8 << 20 // Limit memory buffer to 8 MiB
```


### Bound request bodies and connection lifetimes at the server

**Use when**

Starting a Gin server and accepting request bodies of any kind.

**Secure rules**

**Rule 1: Cap request body reads with `http.MaxBytesReader`.**

`MaxMultipartMemory` only governs how much of a multipart form is buffered in RAM before the rest spills to temporary files; it caps neither the request overall nor JSON and raw bodies. Wrapping `c.Request.Body` before binding makes the read fail past the limit, so an unbounded upload is rejected instead of filling memory or disk. Applying it as middleware covers routes added later.

```go
func BodyLimit(maxBytes int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
        c.Next()
    }
}

func main() {
    router := gin.Default()
    router.Use(BodyLimit(10 << 20)) // 10 MiB per request
}
```

**Rule 2: Set explicit timeouts on the `http.Server` rather than using `router.Run`.**

`router.Run` calls `http.ListenAndServe`, which leaves `ReadTimeout`, `WriteTimeout`, and `IdleTimeout` at zero — meaning no timeout at all. A client sending headers one byte at a time then holds file descriptors and goroutines indefinitely. Construct the `http.Server` yourself so slow and idle peers are disconnected; `ReadHeaderTimeout` bounds the header phase specifically.

```go
srv := &http.Server{
    Addr:              ":8080",
    Handler:           router,
    ReadHeaderTimeout: 5 * time.Second,
    ReadTimeout:       15 * time.Second,
    WriteTimeout:      30 * time.Second,
    IdleTimeout:       60 * time.Second,
}
if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
    log.Fatal(err)
}
```


### Bound work whose cost the caller controls

**Use when**

Running pattern matching, spawning an external process, or decompressing an archive using data from the request.

**Secure rules**

**Rule 1: Keep request-supplied patterns out of `regexp`, and cap the text they match against.**

Go's `regexp` implements RE2, which runs linear in the input and so avoids the exponential backtracking `(a+)+` causes elsewhere — useful, but not a complete defence, since cost stays linear in the product of pattern and subject size. Compile patterns once at startup, treat a caller-supplied needle as a literal with `regexp.QuoteMeta` or `strings.Contains`, and bound the subject length.

```go
const maxSubject = 1 << 20 // 1 MiB

router.GET("/search", func(c *gin.Context) {
    needle := c.Query("needle")
    haystack := loadDocument(c.Query("doc"))
    if len(haystack) > maxSubject {
        c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "content too large"})
        return
    }
    // The caller supplies text to find, not a pattern to compile.
    re := regexp.MustCompile(regexp.QuoteMeta(needle))
    c.JSON(http.StatusOK, gin.H{"matches": re.FindAllStringIndex(haystack, 100)})
})
```

**Rule 2: Give every external process a deadline with `exec.CommandContext`.**

`cmd.Run` waits as long as the child runs, so an input that makes a converter or decoder loop holds the goroutine, its pipes, and its file descriptors indefinitely. Deriving the command from a `context.WithTimeout` kills the process at the deadline, and checking `ctx.Err()` afterwards tells a timeout apart from an ordinary failure. `cmd.WaitDelay` additionally bounds how long `Wait` blocks when the child leaves an inherited pipe open after being signalled.

```go
router.POST("/thumbnails", func(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
    defer cancel()

    cmd := exec.CommandContext(ctx, "convert", source, "-resize", "128x128", target)
    cmd.WaitDelay = 2 * time.Second
    err := cmd.Run()
    if ctx.Err() == context.DeadlineExceeded {
        c.JSON(http.StatusGatewayTimeout, gin.H{"error": "conversion timed out"})
        return
    }
    if err != nil {
        c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "conversion failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"output": target})
})
```

**Rule 3: Limit how many bytes an archive may expand to.**

Compression ratios above 1000:1 are easy to construct, so a few kilobytes of upload can expand into gigabytes and exhaust memory or disk. Copy each member through an `io.LimitReader` and track a running total, which enforces the limit on the bytes actually produced. `zip.File.UncompressedSize64` is a useful pre-check but is read from the archive itself and can be falsified.

```go
const maxTotalBytes = 50 << 20 // 50 MiB

func extractBounded(r *zip.ReadCloser, dst io.Writer) error {
    var written int64
    for _, f := range r.File {
        if f.FileInfo().IsDir() {
            continue
        }
        rc, err := f.Open()
        if err != nil {
            return err
        }
        n, err := io.Copy(dst, io.LimitReader(rc, maxTotalBytes-written))
        rc.Close()
        if err != nil {
            return err
        }
        written += n
        if written >= maxTotalBytes {
            return errors.New("archive expands beyond the allowed size")
        }
    }
    return nil
}
```
