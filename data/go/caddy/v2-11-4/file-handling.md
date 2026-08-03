# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: file handling

## file handling

### Safely Join File Paths and Restrict Document Roots

**Use when**

When mapping untrusted HTTP request paths, FastCGI configurations, or template file operations to local filesystem paths.

**Secure rules**

**Rule 1: Use sanitized path join functions and enforce document root isolation**

When mapping untrusted HTTP request paths to local filesystem paths in custom Caddy HTTP modules, use `caddyhttp.SanitizedPathJoin(root, reqPath)` rather than standard library functions like `filepath.Join` or `path.Join`. Ensure root directories and FastCGI script destinations resolve to an intended base directory to prevent directory traversal attacks.

```go
safePath := caddyhttp.SanitizedPathJoin(webRoot, req.URL.Path)
file, err := os.Open(safePath)
if err != nil {
    return err
}
defer file.Close()
```
