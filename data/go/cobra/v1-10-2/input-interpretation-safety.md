# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: input interpretation safety

## input interpretation safety

### Enforce Strict Flag Parsing and Disable Command Prefix Matching

**Use when**

Configuring Cobra command execution and flag parsing behavior to prevent input interpretation bypasses and unauthorized subcommand execution.

**Secure rules**

**Rule 1: Enforce strict flag error handling by leaving `FParseErrWhitelist` unconfigured.**

Do not ignore flag parsing errors via `FParseErrWhitelist` unless strictly necessary. Allowing flag errors to be ignored permits unknown, malformed, or improperly formatted flag inputs to pass through silently to command handlers without triggering validation failures.

```go
cmd := &cobra.Command{
    Use: "app",
    RunE: func(cmd *cobra.Command, args []string) error {
        return nil
    },
}
```

**Rule 2: Keep automatic command prefix matching disabled to prevent ambiguous subcommand execution.**

Keep automatic command prefix matching disabled by setting `cobra.EnablePrefixMatching = false`. When prefix matching is enabled, Cobra executes commands based on partial name matches, which can lead to unintentional execution of administrative or destructive subcommands if inputs are ambiguous or abbreviated.

```go
package main

import "github.com/spf13/cobra"

func main() {
	cobra.EnablePrefixMatching = false
}
```
