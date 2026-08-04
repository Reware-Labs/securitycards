# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: input interpretation safety

## input interpretation safety

### Canonicalize and Sanitize Untrusted Prompt Inputs and Control Tokens

**Use when**

Processing untrusted user strings, custom prompt templates, tokenizer encodings, and inline control tokens before passing them to model inference handlers.

**Secure rules**

**Rule 1: Sanitize and isolate untrusted user input before tokenization or raw prompt generation to prevent control token injection and prompt boundary spoofing.**

When encoding text or setting raw prompt mode, ensure untrusted user input is sanitized or kept strictly within designated user data boundaries. Unsanitized strings containing special token substrings or inline directives can alter prompt evaluation logic or inject control sequences.

```go
tokenizer := NewBytePairEncoding(vocab, pattern)
cleanInput := sanitizeUserInput(rawInput)
ids, err := tokenizer.Encode(cleanInput, true)
if err != nil {
    return err
}
```

**Rule 2: Account for null byte omission during tokenizer decoding steps.**

When decoding token IDs using tokenizer implementations, null bytes (`0x00`) are explicitly omitted from the decoded string output. Developers must not rely on tokenizer Decode calls for exact binary roundtrips or string reconstruction when inputs may contain null bytes to prevent canonicalization mismatches.

```go
ids := tok.Encode(string([]byte{0x00}), false)
decoded := tok.Decode(ids)
// decoded == ""
```
