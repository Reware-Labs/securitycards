# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: file handling

## file handling

### Sanitize and Validate File Paths for Downloads and Access

**Use when**

Handling user input to serve or access files via `c.Download()`, `c.SendFile()`, or custom path resolution.

**Secure rules**

**Rule 1: Verify that user-influenced file paths remain inside the authorized base directory.**

Always clean and check path variables using functions like `filepath.Clean()` and `filepath.Rel()` or prefix validation before passing them to file handling methods. Relying solely on `filepath.Clean()` or basic wrappers is insufficient to prevent path traversal outside the safe root directory.

```go
baseDir := "/var/www/uploads"
userInput := c.Params("filename")
cleanPath := filepath.Clean(filepath.Join(baseDir, filepath.Base(userInput)))

if !strings.HasPrefix(cleanPath, baseDir) {
    return c.Status(fiber.StatusForbidden).SendString("Invalid file path")
}

return c.Download(cleanPath)
```
