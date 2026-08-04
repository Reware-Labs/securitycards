# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: input contract definition

## input contract definition

### Enforce strict positional and flag input validation contracts

**Use when**

Defining command-line interfaces and argument parsing rules to ensure malformed or out-of-contract inputs are rejected before execution.

**Secure rules**

**Rule 1: Enforce positional argument bounds, types, and allowlists using explicit validators**

Always configure `Command.Args` validators such as `ExactArgs`, `RangeArgs`, or `MatchAll` to restrict unexpected positional parameters. Combine input allowlisting with `ValidArgs` by utilizing `cobra.MatchAll(cobra.OnlyValidArgs, ...)` to reject unauthorized values before execution.

```go
cmd := &cobra.Command{
	Use:       "set-role [user] [role]",
	ValidArgs: []string{"admin", "developer", "viewer"},
	Args:      cobra.MatchAll(cobra.OnlyValidArgs, cobra.ExactArgs(2)),
	Run: func(cmd *cobra.Command, args []string) {
		// Safely process exactly 2 arguments that match ValidArgs allowlist
	},
}
```

**Rule 2: Enforce mutually exclusive and co-dependent CLI flags using built-in flag group rules**

Use Cobra's validation helpers like `MarkFlagsRequiredTogether`, `MarkFlagsOneRequired`, and `MarkFlagsMutuallyExclusive` to declare strict relationships between command-line options. Cobra will automatically validate these dependencies during parsing and reject invalid flag combinations.

```go
cmd := &cobra.Command{
    Use: "deploy",
    RunE: func(cmd *cobra.Command, args []string) error {
        return nil
    },
}
cmd.Flags().String("cert", "", "path to cert")
cmd.Flags().String("key", "", "path to key")
cmd.Flags().String("token", "", "auth token")
cmd.MarkFlagsRequiredTogether("cert", "key")
cmd.MarkFlagsMutuallyExclusive("cert", "token")
```
