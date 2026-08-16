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

**Rule 2: Read text fields as text, not as uploaded files**

A multipart request can contain both ordinary fields and files. Use `c.PostForm` or `c.GetPostForm` for text fields and reserve `c.FormFile` for actual file parts; treating a text field as a file rejects valid requests.

```go
page, ok := c.GetPostForm("profile_page")
if !ok {
    c.String(http.StatusBadRequest, "Missing profile page")
    return
}
photo, err := c.FormFile("profile_photo")
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


### Contain archive members inside the extraction directory

**Use when**

Unpacking a zip or tar archive that arrived as an upload or from a caller-supplied location.

**Secure rules**

**Rule 1: Confirm each member's destination stays inside the extraction root.**

Archive entries carry their own path and neither `archive/zip` nor `archive/tar` sanitizes it, so a member named `../../etc/cron.d/job` writes exactly there. `filepath.IsLocal` rejects absolute paths, `..` components, and reserved Windows names in one call, and joining a local name to the root cannot leave it. Skip entries that are not regular files, so no symlink redirects later reads.

```go
func extractMember(root string, f *zip.File) error {
    if !filepath.IsLocal(f.Name) {
        return fmt.Errorf("unsafe archive entry: %s", f.Name)
    }
    if !f.FileInfo().Mode().IsRegular() {
        return nil // skip directories, symlinks, devices
    }
    dst := filepath.Join(root, f.Name)
    if err := os.MkdirAll(filepath.Dir(dst), 0o750); err != nil {
        return err
    }
    src, err := f.Open()
    if err != nil {
        return err
    }
    defer src.Close()

    out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
    if err != nil {
        return err
    }
    defer out.Close()

    _, err = io.Copy(out, src)
    return err
}
```
