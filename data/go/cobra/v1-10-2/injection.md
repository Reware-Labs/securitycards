# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: injection

## injection

### Use Static Strings for Bash Completion Annotations

**Use when**

Configuring flag annotations for legacy Bash completion in Cobra commands.

**Secure rules**

**Rule 1: Supply only hardcoded, trusted shell function names or shell snippets in flag annotations.**

When configuring flag annotations for legacy Bash completion using annotations such as `BashCompCustom`, ensure that you pass static string literals or predefined shell function names instead of untrusted dynamic data. Cobra writes annotation values directly into the generated shell script flags completion array without sanitization, so using dynamic input can lead to arbitrary shell command execution during tab-completion.

```go
cmd.Flags().StringVarP(&outputFormat, "format", "f", "", "Output format")
_ = cmd.Flags().SetAnnotation("format", cobra.BashCompCustom, []string{"__my_static_completion_func"})
```
