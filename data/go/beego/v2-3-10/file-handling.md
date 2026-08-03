# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: file handling

## file handling

### Validate and Sanitize File Paths to Prevent Path Traversal

**Use when**

When handling user input or uploaded filenames in controller operations, file downloads, or file attachments.

**Secure rules**

**Rule 1: Sanitize user-uploaded filenames using `filepath.Base` and construct explicit target paths before saving files.**

Never use untrusted `multipart.FileHeader.Filename` values directly to build disk paths when processing uploads via `Controller.GetFile`, `Controller.GetFiles`, or `Controller.SaveToFile`. Developers must sanitize the filename using `filepath.Base` or generate isolated, random filenames before calling `SaveToFile` to prevent arbitrary file overwrite or execution outside designated upload directories.

```go
func (c *UploadController) Post() {
	_, header, err := c.GetFile("upload")
	if err != nil {
		c.CustomAbort(400, "Invalid file")
		return
	}
	safeFilename := filepath.Base(header.Filename)
	targetPath := filepath.Join("/var/app/storage/uploads", safeFilename)
	err = c.SaveToFile("upload", targetPath)
	if err != nil {
		c.CustomAbort(500, "Failed to save file")
	}
}
```

**Rule 2: Verify resolved file paths remain strictly within intended storage boundaries before serving downloads.**

Ensure user-supplied filenames passed to `BeegoOutput.Download` are sanitized with `filepath.Clean` and verified to remain strictly within the intended storage directory to prevent arbitrary file read vulnerabilities.

```go
baseDir := "/var/app/uploads"
targetPath := filepath.Clean(filepath.Join(baseDir, userInputFilename))
if !strings.HasPrefix(targetPath, filepath.Clean(baseDir)+string(filepath.Separator)) {
    ctx.Output.SetStatus(403)
    return
}
ctx.Output.Download(targetPath)
```
