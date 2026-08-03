# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: output encoding

## output encoding

### Sanitize command names in generated completion scripts

**Use when**

When generating Fish shell completion files using `GenFishCompletionFile` in Cobra applications.

**Secure rules**

**Rule 1: Rely on Cobra built-in sanitization for command names and handle file write errors explicitly.**

When generating completion files, rely on Cobra to automatically sanitize special characters in command names. Always check the returned error from `GenFishCompletionFile` to ensure failures are handled safely.

```go
err := rootCmd.GenFishCompletionFile("/tmp/app.fish", false)
if err != nil {
    log.Fatalf("Failed to generate fish completion file: %v", err)
}
```
