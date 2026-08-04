# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: access control

## access control

### Enforce Interactive Authorization Checks for Agent Tool Execution

**Use when**

Configuring chat sessions and agent workflows where models can execute external tools or perform sensitive actions.

**Secure rules**

**Rule 1: Gate model-initiated tool execution behind explicit authorization and approval prompters.**

When configuring agent sessions or chat options, keep `AllowAllTools` set to false or `DisableTools` set to false only if a custom `ApprovalPrompter` and `ApprovalState` are supplied. This ensures that sensitive file system or system commands require explicit human authorization before being executed by the engine.

```go
session := &agent.Session{
	Client:           chatClient,
	ApprovalPrompter: customPrompter,
	ApprovalState:    &agent.ApprovalState{},
}
```
