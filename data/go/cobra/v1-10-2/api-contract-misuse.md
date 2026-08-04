# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: api contract misuse

## api contract misuse

### Ensure Flag Parsing Remains Enabled When Using Flag Group Validation

**Use when**

Developing Cobra command execution handlers that rely on flag group validation rules.

**Secure rules**

**Rule 1: Do not set DisableFlagParsing to true on commands where flag group validation rules are configured.**

Ensure that `DisableFlagParsing` is set to `false` so that Cobra properly evaluates required, one-required, and mutually exclusive flag constraints prior to execution.

```go
cmd := &cobra.Command{
	Use: "connect",
	DisableFlagParsing: false,
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}
```
