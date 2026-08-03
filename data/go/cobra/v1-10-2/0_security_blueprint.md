# Security blueprint

Repository: `https://github.com/spf13/cobra#v1.10.2`

## Security posture

Cobra provides a structured framework for command-line interfaces, but developers must explicitly configure parsing boundaries, hook traversal, and input validations to ensure security. The library does not protect against improper command nesting, unbounded execution, or dynamic script injection by default. Security-sensitive surfaces include argument processing, flag scopes, shell completion generation, and persistent hooks, where failures should fail closed.

## Essential implementation rules

1. **Maintain Flag Parsing During Validation**

Do not set `DisableFlagParsing` to true on commands that rely on flag group validation rules so that Cobra properly evaluates required and mutually exclusive flag constraints prior to execution.

2. **Restrict Flag Scope to Prevent Boundary Leakage**

Always attach command-specific options using `cmd.Flags()` rather than `cmd.PersistentFlags()` when data or security state should not cross the boundary into child subcommands.

3. **Validate File Paths for Completion Generation**

Sanitize and validate destination filenames using functions like `filepath.Clean` and check path containment or enforce `filepath.Base` before passing paths to completion generation methods.

4. **Use Static Strings for Bash Completion Annotations**

When configuring flag annotations for legacy Bash completion using `BashCompCustom`, pass only hardcoded, trusted shell function names or static literals instead of untrusted dynamic data.

5. **Enforce Strict Positional and Flag Input Contracts**

Configure `Command.Args` validators like `ExactArgs`, `RangeArgs`, or `MatchAll` with `OnlyValidArgs`, and use helper functions like `MarkFlagsRequiredTogether` and `MarkFlagsMutuallyExclusive` to reject malformed inputs.

6. **Disable Command Prefix Matching and Strict Flag Error Handling**

Keep automatic command prefix matching disabled by setting `cobra.EnablePrefixMatching = false` and leave `FParseErrWhitelist` unconfigured to prevent ambiguous subcommand execution and silent flag errors.

7. **Sanitize Command Names in Generated Completion Scripts**

Rely on Cobra built-in sanitization for command names and handle returned errors explicitly when generating completion files.

8. **Propagate Bounded Contexts to Commands**

Ensure that execution logic inside hooks and handlers consumes `cmd.Context()` or `ExecuteContext` when performing operations requiring timeouts or cancellation signals.

9. **Disable ActiveHelp in Restricted Environments**

Set `COBRA_ACTIVE_HELP=0` globally in automated or restricted environments to turn off ActiveHelp evaluation and prevent diagnostic terminal outputs or script side effects.

10. **Omit Sensitive Data from Active Help Messages**

Ensure that active help strings generated via `AppendActiveHelp` contain only generic instructions or non-sensitive status messages to prevent leaking secrets into logs.

11. **Enable Hook Traversal for Ancestor Security Checks**

Set `cobra.EnableTraverseRunHooks = true` during application initialization to ensure that parent and child command `PersistentPreRun` hooks are properly traversed and executed down the command tree.
