# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: file handling

## file handling

### Validate and sanitize file paths before generating shell completion scripts

**Use when**

Generating shell completion scripts using Cobra file generation functions like `GenBashCompletionFileV2`, `GenPowerShellCompletionFile`, or `GenFishCompletionFile` where destination paths might be influenced by users.

**Secure rules**

**Rule 1: Verify that output file paths for generated completion scripts are strictly validated and contained within trusted directory roots.**

Sanitize and validate destination filenames using functions like `filepath.Clean` and check path containment with `strings.HasPrefix` or enforce `filepath.Base` before passing the path to Cobra completion generation methods.

```go
func generateCompletion(cmd *cobra.Command, outputDir string) error {
	cleanDir := filepath.Clean(outputDir)
	if !strings.HasPrefix(cleanDir, "/safe/completion/path") {
		return fmt.Errorf("untrusted output directory: %s", cleanDir)
	}
	targetPath := filepath.Join(cleanDir, "app.bash")
	return cmd.GenBashCompletionFileV2(targetPath, true)
}
```
