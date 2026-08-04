# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: file handling

## file handling

### Sanitize and Validate Uploaded Filenames and Paths in Gin

**Use when**

Handling file uploads from multipart forms in Gin handlers and saving them to the local filesystem.

**Secure rules**

**Rule 1: Strip untrusted path information from uploaded filenames before saving files**

When accepting file uploads via `c.FormFile`, never trust the client-supplied `file.Filename` directly because it may contain directory traversal sequences like `../../`. Use filepath.Base, reject . and non-local results, then join the filename with a safe destination directory.

```go
file, err := c.FormFile("file")
if err != nil {
    c.String(http.StatusBadRequest, "Bad request")
    return
}
filename := filepath.Base(file.Filename)
if filename == "." || !filepath.IsLocal(filename) {
c.String(http.StatusBadRequest, "Invalid filename")
return
}
dst := filepath.Join("/safe/upload/dir", filename)
c.SaveUploadedFile(file, dst)
```


### Secure Static File Serving and Path Containment in Gin

**Use when**

Serving static files, asset folders, or handling custom file path parameters in Gin applications.

**Secure rules**

**Rule 1: Sanitize and confine custom file paths within designated storage roots when using `c.File()`**

Never pass raw user inputs or unvalidated path parameters directly to `c.File()`. Clean requested paths, verify they remain within the safe base directory, and ensure the target is a regular file before serving.

```go
r.GET("/assets/*filepath", func(c *gin.Context) {
	name := strings.TrimPrefix(c.Param("filepath"), "/")

	file, err := os.OpenInRoot("/var/www/static", name)
	if err != nil {
		c.String(http.StatusNotFound, "File not found")
		return
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		c.String(http.StatusNotFound, "File not found")
		return
	}

	http.ServeContent(c.Writer, c.Request, info.Name(), info.ModTime(), file)
})
```

**Rule 2: Restrict root directory paths when exposing static content via static routing functions.**

Ensure that root paths or file system instances passed to `Static`, `StaticFile`, or `StaticFS` target only explicitly intended public directories and avoid broad system paths or untrusted input.

```go
ginS.Static("/assets", "./public/assets")
ginS.StaticFile("/favicon.ico", "./public/favicon.ico")
```

**Rule 3: Disable directory browsing when serving static files.**

Ensure directory listing is explicitly disabled to prevent exposing directory indexes when configuring custom file systems with `StaticFS` or `StaticFileFS`.

```go
router := gin.Default()
router.Static("/public", "./public")
router.StaticFS("/assets", gin.Dir("./assets", false))
```
