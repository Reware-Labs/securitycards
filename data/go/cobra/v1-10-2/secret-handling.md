# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: secret handling

## secret handling

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
