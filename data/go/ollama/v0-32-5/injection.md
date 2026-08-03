# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: injection

## injection

### Sanitize prompt control tags in untrusted user inputs for FunctionGemma

**Use when**

Passing user messages, tool definitions, or tool arguments into the FunctionGemma renderer where control tokens could break prompt encapsulation.

**Secure rules**

**Rule 1: Sanitize prompt framing control tags from user inputs before submission**

Strip or encode Gemma structural tags such as `<start_of_turn>`, `<end_of_turn>`, and `<escape>` from user inputs and tool responses before submitting them to the API. This prevents attackers from prematurely closing message blocks and injecting fake tool calls or developer instructions.

```go
func sanitizeInput(input string) string {
	replacer := strings.NewReplacer(
		"<start_of_turn>", "",
		"<end_of_turn>", "",
		"<start_function_declaration>", "",
		"<end_function_declaration>", "",
		"<start_function_call>", "",
		"<end_function_call>", "",
		"<start_function_response>", "",
		"<end_function_response>", "",
		"<escape>", "",
	)
	return replacer.Replace(input)
}
```
