# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: api contract misuse

## api contract misuse

### Handle Unsupported File Inputs Before OpenAI Requests

**Use when**

When building OpenAI compatibility adapter requests and passing input items to `convertResponsesContent`.

**Secure rules**

**Rule 1: Filter out unsupported file inputs before invoking OpenAI request processing.**

Do not pass file content items in OpenAI Responses request payloads, as `convertResponsesContent` explicitly rejects file inputs and returns an error. Filter out file content inputs or convert supported content into text or base64 image objects before calling `FromResponsesRequest`.

```go
msg := openai.ResponsesInputMessage{
    Role: "user",
    Content: []openai.ResponsesContent{
        openai.ResponsesTextContent{
            Type: "input_text",
            Text: "Content to analyze",
        },
    },
}
```
