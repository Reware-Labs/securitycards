# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: resource exhaustion

## resource exhaustion

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
