# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: resource exhaustion

## resource exhaustion

### Configure Context Limits and Truncation Options for Generation Requests

**Use when**

When building multi-turn chat sessions or text generation pipelines where prompt sizes or conversation histories risk exceeding model context window bounds.

**Secure rules**

**Rule 1: Specify explicit context limits and enable truncation for prompt histories**

Always supply an explicit context window limit via `num_ctx` in request options and enable context truncation to ensure that prompt history exceeding the maximum context length is truncated deterministically prior to tokenization and execution.

```go
opts := &api.Options{
    Runner: api.Runner{
        NumCtx: 4096,
    },
}
prompt, images, err := chatPrompt(ctx, model, tokenizer, opts, msgs, nil, thinkVal, true)
```

**Rule 2: Cap model prediction token limits and generation budgets**

Set explicit prediction limits using `NumPredict` or `max_tokens` parameters to cap open-ended generation requests and prevent unbounded text generation from exhausting system resources.

```python
message = client.messages.create(
    model='qwen3-coder',
    max_tokens=1024,
    messages=[
        {'role': 'user', 'content': 'Hello, how are you?'}
    ]
)
```

**Rule 3: Validate prompt length before initiating generation pipelines**

Execute request validation via `Prepare` prior to running text generation pipelines to enforce model context window limits and constrain token generation budgets.

```go
req := &mlxrunner.Request{
    Prompt: userPrompt,
    Options: mlxrunner.Options{NumPredict: requestedTokens},
}
if err := runner.Prepare(req); err != nil {
    return fmt.Errorf("invalid request prompt: %w", err)
}
```


### Enforce Input Size Limits on File Uploads and Compressed Payload Streams

**Use when**

When handling client-side file validations, user uploads, or incoming compressed request bodies on server endpoints.

**Secure rules**

**Rule 1: Enforce maximum file size limits during client-side file validation**

Specify an explicit `maxFileSize` threshold using `validateFile` to reject oversized files before reading or transferring them, preventing client-side memory exhaustion.

```typescript
const result = validateFile(file, {
  hasVisionCapability: true,
  maxFileSize: 10
});
if (!result.valid) {
  console.error("File validation failed:", result.error);
}
```

**Rule 2: Enforce strict size limits on compressed request payloads**

Enforce explicit size limits on decompressed streams or check uncompressed payload lengths prior to handling compressed incoming requests to prevent decompression bombs.

```go
if len(uncompressedPayload) > 20<<20 {
    return errors.New("payload exceeds maximum allowed decompressed limit of 20MB")
}
```


### Manage Model Memory Residency and Concurrency Limits to Prevent Resource Exhaustion

**Use when**

When managing model lifecycle persistence, concurrent file/blob transfers, or server request queues in resource-constrained environments.

**Secure rules**

**Rule 1: Unload idle models explicitly using keep_alive parameters**

Manage loaded model memory residency explicitly by passing the `keep_alive` parameter or setting `keep_alive` to 0 with an empty prompt to immediately unload idle models from VRAM and RAM.

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "keep_alive": 0
}'
```

**Rule 2: Set conservative concurrency limits for blob transfer operations**

Explicitly configure `Concurrency` and `BodyConcurrency` when initializing transfer options rather than relying on high default settings that can cause socket exhaustion or IOPS saturation.

```go
opts := transfer.DownloadOptions{
    Concurrency:     4,
    BodyConcurrency: 2,
    BaseURL:         "https://registry.example.com",
    Files:           blobs,
}
```

**Rule 3: Close cache sessions securely to prevent memory leaks**

Ensure `session.close()` is invoked via `defer` after beginning an MLX prefix cache session to release pending prefill snapshots and free allocated memory if execution fails or is canceled.

```go
session := prefixCache.begin(inputTokens)
defer session.close()
```
