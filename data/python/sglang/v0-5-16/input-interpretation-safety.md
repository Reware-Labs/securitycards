# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: input interpretation safety

## input interpretation safety

### Validate and Normalize Untrusted Input Payloads and Tool Call Arguments

**Use when**

Parsing, decoding, or interpreting incoming request payloads, chat completions, and model-generated tool call arguments from untrusted clients.

**Secure rules**

**Rule 1: Validate request payload structure and fields defensively using targeted parsing structs or default fallbacks before allocating deep dynamic memory.**

Perform light-weight schema probing on incoming request bodies using targeted structs, or use safe extraction methods such as `.get()`, `.and_then()`, and `.as_array()` with default fallbacks to prevent panics, excessive memory consumption, or unhandled errors from malformed input variants.

```rust
#[derive(Debug, serde::Deserialize)]
struct RequestProbe {
    #[serde(default)]
    stream: Option<bool>,
    #[serde(default)]
    model: Option<String>,
}

let probe: RequestProbe = serde_json::from_slice(&body_bytes)?;
```

**Rule 2: Enforce strict JSON object validation for assistant tool call arguments.**

Ensure that function arguments in tool call histories are formatted as valid JSON strings that deserialize strictly into JSON objects or dictionaries, raising errors for invalid or non-object structures to prevent execution bypasses or parsing failures.

```python
assistant_message = {
    "role": "assistant",
    "tool_calls": [
        {
            "function": {
                "name": "search_db",
                "arguments": "{\"query\": \"security_audit\"}"
            }
        }
    ]
}
```
