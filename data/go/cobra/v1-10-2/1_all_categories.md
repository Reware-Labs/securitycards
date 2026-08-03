# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`

## Category: api contract misuse

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


## Category: boundary control

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


## Category: file handling

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


## Category: injection

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


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: output encoding

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


## Category: resource exhaustion

### Pass Bounded Contexts to Cobra Commands via ExecuteContext and cmd.Context()

**Use when**

Developing Cobra command execution logic, hooks, or handlers that perform operations requiring operation timeouts or cancellation.

**Secure rules**

**Rule 1: Propagate context timeouts or cancellation signals to Cobra command handlers using `cmd.Context()` or `ExecuteContext` to limit resource consumption.**

Ensure that execution logic inside `PreRun`, `Run`, and `PostRun` hooks consumes `cmd.Context()` when performing operations such as network calls to prevent hanging executions and unbounded resource usage.

```go
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

cmd := &cobra.Command{
    Use: "fetch",
    RunE: func(cmd *cobra.Command, args []string) error {
        req, err := http.NewRequestWithContext(cmd.Context(), "GET", "https://example.com", nil)
        if err != nil {
            return err
        }
        _, err = http.DefaultClient.Do(req)
        return err
    },
}
cmd.ExecuteContext(ctx)
```


## Category: runtime environment hardening

### Disable ActiveHelp in Restricted Execution Environments

**Use when**

Deploying and executing Cobra CLI applications in automated, containerized, or restricted production environments.

**Secure rules**

**Rule 1: Disable ActiveHelp globally via environment variables in restricted environments to reduce the runtime attack surface and prevent unexpected interactive output.**

Cobra processes global and application-level environment variables to determine whether `ActiveHelp` messages should be rendered. In automated environments, CI/CD runners, or privilege-restricted shells, set `COBRA_ACTIVE_HELP=0` to globally turn off ActiveHelp evaluation and prevent diagnostic terminal outputs or script side effects.

```bash
export COBRA_ACTIVE_HELP=0
```


## Category: secret handling

### Exclude Sensitive Data from Active Help Completion Messages

**Use when**

Populating dynamic completion messages using `AppendActiveHelp` in Cobra command definitions.

**Secure rules**

**Rule 1: Omit sensitive information such as credentials, tokens, and internal paths from active help strings.**

When calling `AppendActiveHelp` to provide dynamic completion guidance, ensure that the active help text contains only generic instructions or non-sensitive status messages to prevent leaking secrets into terminal output logs or screen-sharing streams.

```go
func DynamicComp(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
	var completions []string
	completions = cobra.AppendActiveHelp(completions, "Enter target region name")
	return completions, cobra.ShellCompDirectiveNoFileComp
}
```


## Category: security control integrity

### Enable hook traversal to ensure ancestor security checks execute

**Use when**

When implementing global security controls, token validation, user authentication, or privilege checks in parent command PersistentPreRun hooks within Cobra CLI applications.

**Secure rules**

**Rule 1: Enable cobra.EnableTraverseRunHooks so that ancestor pre-run and post-run hooks execute down the command tree.**

Set `cobra.EnableTraverseRunHooks = true` during application initialization to ensure that parent and child command `PersistentPreRun` hooks are properly traversed and executed. By default, Cobra only executes the nearest defined pre-run hook in the command hierarchy, which can cause child commands to silently bypass parent security validations.

```go
package main

import "github.com/spf13/cobra"

func main() {
	// Traverse and execute all parent persistent pre-run/post-run hooks
	cobra.EnableTraverseRunHooks = true
}
```
