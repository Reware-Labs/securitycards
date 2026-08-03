# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: boundary control

## boundary control

### Restrict Flag Scope Using Local Flag Sets to Prevent Privilege Boundary Leakage

**Use when**

When defining parameters that should apply exclusively to a single root or subcommand, preventing unauthorized child commands from inheriting sensitive options.

**Secure rules**

**Rule 1: Use local flag sets for command-specific parameters to enforce strict trust transition boundaries.**

Always attach command-specific options using `cmd.Flags()` rather than `cmd.PersistentFlags()` when the data or security state should not cross the boundary into child subcommands. Cobra enforces strict isolation for local flags and will reject them if passed to unauthorized child contexts.

```go
rootCmd := &cobra.Command{Use: "app"}
childCmd := &cobra.Command{Use: "sub", Run: runSub}
rootCmd.AddCommand(childCmd)

// Local flag: only valid for rootCmd execution, rejected if passed to childCmd
rootCmd.Flags().String("token", "", "Admin secret token")

// Persistent flag: intentionally inherited by childCmd
rootCmd.PersistentFlags().Bool("verbose", false, "Enable verbose output")
```
