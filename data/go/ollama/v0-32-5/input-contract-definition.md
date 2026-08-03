# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: input contract definition

## input contract definition

### Validate API request payloads and parameters against expected input contracts

**Use when**

When building and handling API requests, generating model outputs, and configuring parameters in Ollama.

**Secure rules**

**Rule 1: Enforce valid ranges for numerical generation parameters**

Validate that input parameters such as `top_logprobs` fall within their accepted boundaries prior to processing requests to prevent error responses and interrupted operations.

```go
req := api.GenerateRequest{
    Model: "llama3",
    Prompt: "Write a summary",
    TopLogprobs: 5,
}
```

**Rule 2: Enforce strict schema constraints on structured outputs and tool definitions**

Pass valid JSON schema definitions in the `format` or `InputSchema` fields to enforce strict data types, required fields, and valid tool identifiers.

```json
{
  "model": "llama3.1:8b",
  "prompt": "Provide user metadata. Respond using JSON",
  "stream": false,
  "format": {
    "type": "object",
    "properties": {
      "age": { "type": "integer" },
      "available": { "type": "boolean" }
    },
    "required": ["age", "available"]
  }
}
```

**Rule 3: Validate required model creation metadata types**

Ensure supported `Info` values use the types expected by the create endpoint to avoid rejected requests.
