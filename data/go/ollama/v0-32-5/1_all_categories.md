# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`

## Category: access control

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


## Category: api contract misuse

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


## Category: authentication

### Enforce Token Cookies and Server Security Settings for UI APIs

**Use when**

When configuring UI server instances and handling requests to application UI endpoints.

**Secure rules**

**Rule 1: Disable development mode in production to enforce token validation.**

Ensure `Server.Dev` is set to `false` when instantiating the UI server in production environments, ensuring incoming requests are properly authenticated via token cookies.

```go
s := &ui.Server{
    Logger: logger,
    Token:  requiredAuthToken,
    Dev:    false,
}
```

**Rule 2: Attach valid token cookies to API requests targeting protected UI server routes.**

Attach the secret token cookie matching the server configuration on every client request to avoid receiving HTTP 403 Forbidden rejection responses.

```go
req, err := http.NewRequest("POST", "http://localhost:11434/api/v1/settings", bytes.NewReader(body))
if err != nil {
    return err
}
req.Header.Set("Content-Type", "application/json")
req.AddCookie(&http.Cookie{
    Name:  "token",
    Value: authToken,
})
resp, err := client.Do(req)
```


### Validate Authentication Tokens and Realms in Registry Transfer Options

**Use when**

When building custom token handlers and download or upload options for communicating with protected model registries.

**Secure rules**

**Rule 1: Pass a dynamic GetToken callback to evaluate WWW-Authenticate challenges securely.**

Implement `GetToken` inside `DownloadOptions` or `UploadOptions` to inspect challenge parameters and fetch tokens securely without hardcoding credentials.

```go
err := transfer.Download(ctx, transfer.DownloadOptions{
    Blobs:   blobs,
    BaseURL: registryURL,
    DestDir: destDir,
    GetToken: func(ctx context.Context, challenge transfer.AuthChallenge) (string, error) {
        return tokenClient.FetchToken(ctx, challenge.Realm, challenge.Service, challenge.Scope)
    },
})
```

**Rule 2: Validate challenge realms and domains before issuing token requests.**

Ensure that challenge realm URLs match the expected registry host and trusted prefixes before returning authorization secrets to prevent leaking credentials to external hosts.

```go
opts := transfer.DownloadOptions{
    GetToken: func(ctx context.Context, challenge transfer.AuthChallenge) (string, error) {
        if !strings.HasPrefix(challenge.Realm, "https://registry.example.com/") {
            return "", errors.New("untrusted authentication realm")
        }
        return fetchAuthToken(ctx, challenge.Scope)
    },
}
```


## Category: boundary control

### Validate Model Namespaces and Names in Multi-Tenant Model Serving

**Use when**

Developing multi-tenant model serving endpoints where clients supply model names and paths that must be restricted to authorized tenant namespaces.

**Secure rules**

**Rule 1: Enforce authorization for every model request outside Ollama**

Parse and validate the canonical model name, then authorize that full name in the authenticated application or proxy before forwarding the request to Ollama.

```go
parsed := model.ParseName(userRequestedModel)
if !parsed.IsValid() {
    return errors.New("invalid model name")
}
if !authorizeModel(currentTenant, parsed.String()) {
    return errors.New("access denied")
}
// Proceed with model serving
```

**Rule 2: Prevent traversal vulnerabilities by validating model paths and qualification.**

Always parse model paths using `model.ParseNameFromFilepath` and ensure `IsFullyQualified()` returns true before calling `.Filepath()` to prevent unauthorized cross-tenant file access and runtime panics.

```go
import "github.com/ollama/ollama/types/model"

func LoadTenantModel(userSuppliedPath string) (model.Name, bool) {
    n := model.ParseNameFromFilepath(userSuppliedPath)
    if !n.IsValid() || n.Namespace == "" || n.Model == "" {
        return model.Name{}, false
    }
    return n, true
}
```


### Validate native binding arguments at the bridge boundary

**Use when**

Registering and implementing native host functions exposed to untrusted JavaScript via webview bindings.

**Secure rules**

**Rule 1: Treat incoming JSON request parameters in native binding callbacks as untrusted input and validate all arguments before processing.**

When exposing native C or C++ host functions using `webview_bind`, always parse and validate the JSON request parameter (`req`) completely before passing any values into system functions, file operations, or native APIs.

```c
void my_binding_cb(const char *seq, const char *req, void *arg) {
    webview_t w = (webview_t)arg;
    /* Parse req, validate input values, then return result */
    webview_return(w, seq, 0, "{\"status\":\"success\"}");
}

webview_bind(w, "myNativeFunc", my_binding_cb, w);
```


## Category: configuration source integrity

### Enforce Strict Loopback Restrictions and Secure Provenance for Ollama Configuration Sources

**Use when**

When configuring base URLs, environment variables, model tokenizer files, or integration settings for Ollama to prevent untrusted or ambiguous sources from altering security behavior.

**Secure rules**

**Rule 1: Restrict cloud base URL overrides to secure loopback enclaves in production modes.**

When configuring `OLLAMA_CLOUD_BASE_URL`, ensure the URL uses HTTPS and contains no path, query, fragment, or user credentials to prevent unauthorized redirection of proxied cloud requests.

```bash
export OLLAMA_CLOUD_BASE_URL="https://localhost:8443"
```

**Rule 2: Verify tokenizer and model configuration files before import and conversion.**

Verify the checksums and origin of all model configuration files such as `tokenizer.json`, `tokenizer_config.json`, and `generation_config.json` prior to parsing to prevent prompt injection or context misalignment.

```go
func convertModelSafely(modelDir string) (*Tokenizer, error) {
    if err := verifyFileHashes(modelDir); err != nil {
        return nil, fmt.Errorf("untrusted model files: %w", err)
    }
    return parseTokenizer(os.DirFS(modelDir), []string{"bos", "eos"})
}
```

**Rule 3: Control configuration directory environment variables to prevent path hijacking.**

Applications invoking agent configuration logic must validate or explicitly override environment variables such as `PI_CODING_AGENT_DIR` and `PI_CONFIG_DIR` to prevent file redirection and tampering.

```go
t.Setenv("PI_CODING_AGENT_DIR", filepath.Join(trustedDir, "agent"))
t.Setenv("PI_CONFIG_DIR", "")

o := &OMP{}
if err := o.ConfigureWithModels("new-model", models); err != nil {
    log.Fatalf("Configuration failed: %v", err)
}
```


## Category: dangerous execution

### Disable agent shell tool execution in restricted environments

**Use when**

Running Ollama agent sessions in environments where local shell command execution by the model is unsafe or unmonitored.

**Secure rules**

**Rule 1: Set OLLAMA_AGENT_DISABLE_SHELL to restrict the agent runtime from registering and executing shell execution tools.**

Export `OLLAMA_AGENT_DISABLE_SHELL=1` before launching Ollama agent sessions to prevent the model from executing local shell commands.

```bash
export OLLAMA_AGENT_DISABLE_SHELL=1
ollama
```


## Category: deserialization

### Validate Model File Formats, Headers, and Metadata Prior to Deserialization

**Use when**

Use when loading, parsing, or creating model files from untrusted user inputs or local paths in Ollama model workflows.

**Secure rules**

**Rule 1: Enforce strict format validation, MIME type checks, and content-type detection on model files before invoking deserialization or parsing backends.**

Validate model file extensions and MIME content types before allowing model backends to load them. Prioritize safe serialization formats such as Safetensors and GGUF, which do not support executable code. If legacy PyTorch model formats are allowed, enforce strict content-type detection to ensure conformity and prevent loading arbitrary or unverified serialized streams.

```go
files, err := filesForModel(modelDirPath)
if err != nil {
    return nil, fmt.Errorf("failed to validate model file formats: %w", err)
}
```

**Rule 2: Validate GGUF and Safetensors headers, shapes, and metadata boundaries before decoding binary weight payloads**

When parsing Safetensors model weight files, decode metadata using safe JSON parsers rather than executable object deserializers, and validate tensor headers, shapes, and offset bounds. Ensure metadata type constraints and structures are verified to prevent out-of-bounds access, type confusion, or unexpected behavior.

```go
var n int64
if err := binary.Read(f, binary.LittleEndian, &n); err != nil {
    return nil, err
}

info, err := f.Stat()
if err != nil { return nil, err }
const maxSafetensorsHeaderSize int64 = 100 << 20
if n < 0 || n > maxSafetensorsHeaderSize || info.Size() < 8 || n > info.Size()-8 {
    return nil, fmt.Errorf("invalid safetensors header length: %d", n)
}
b := bytes.NewBuffer(make([]byte, 0, n))
if _, err = io.CopyN(b, f, n); err != nil {
    return nil, err
}

var headers map[string]safetensorMetadata
if err := json.NewDecoder(b).Decode(&headers); err != nil {
    return nil, err
}
```


## Category: file handling

### Enforce Strict File Permissions and Validated Types on Uploads and Configurations

**Use when**

Persisting authentication tokens, backing up configurations, and processing user file uploads or extensions in Ollama.

**Secure rules**

**Rule 1: Create sensitive configuration and token files with restrictive permissions and enforce those permissions when modifying existing files**

Use a restrictive mode such as `0600` when creating sensitive files, and explicitly enforce that mode before overwriting an existing file.

```go
f, err := os.OpenFile(pairedJsonPath, os.O_WRONLY|os.O_CREATE, 0o600)
if err != nil { return err }
defer f.Close()
if err := f.Chmod(0o600); err != nil { return err }
if err := f.Truncate(0); err != nil { return err }
if _, err := f.Write(out); err != nil { return err }
```

**Rule 2: Validate file extensions and types against explicit allowed sets when processing uploads.**

When processing user files in UI components, validate file extensions against explicit allowed sets and custom validation rules to prevent processing unexpected file types or malicious inputs.

```typescript
import { processFiles } from '@/utils/fileValidation';

const options = {
  maxFileSize: 5,
  allowedExtensions: ['pdf', 'txt', 'png', 'jpeg'],
  customValidator: (file: File) => {
    if (file.name.includes('..')) {
      return { valid: false, error: 'Invalid filename' };
    }
    return { valid: true };
  }
};

const result = await processFiles(selectedFiles, options);
```


### Prevent Path Traversal and Enforce Containment during File and Model Operations

**Use when**

Processing user-supplied paths, model directories, tokenizers, skill imports, and output save operations in Ollama.

**Secure rules**

**Rule 1: Resolve symbolic links using `filepath.EvalSymlinks` and ensure local paths stay contained within storage boundaries.**

When processing filesystem paths for model components or files, always resolve symbolic links using `filepath.EvalSymlinks` before opening files to prevent unauthorized access outside expected directories. Ensure paths satisfy containment constraints such as `filepath.IsLocal(rel)` or prefix validation.

```go
realPath, err := filepath.EvalSymlinks(path)
if err != nil {
    return "", err
}
bin, err := os.Open(realPath)
if err != nil {
    return "", err
}
defer bin.Close()
```

**Rule 2: Sanitize path parameters and filenames to prevent directory traversal in file saving and import routines.**

When handling commands that write files to disk or import external assets, sanitize and reject path parameters containing directory traversal sequences (`..`) or directory separators to restrict writes and reads strictly to the intended working directory.

```go
if filepath.Base(filename) != filename || strings.Contains(filename, "..") {
    return fmt.Errorf("invalid path: filename must not contain directory paths")
}
```

**Rule 3: Validate and sanitize model directory paths before invoking tokenizer loading**

If accepting an untrusted model path, resolve symlinks and verify that the resolved path remains within an allowed base before calling `tokenizer.Load`, which reads the supplied file or fixed companion files from the supplied directory.

```go
cleanDir, err := filepath.EvalSymlinks(userProvidedPath)
if err != nil { return nil, err }
trustedBase, err := filepath.EvalSymlinks(trustedModelBaseDir)
if err != nil { return nil, err }
rel, err := filepath.Rel(trustedBase, cleanDir)
if err != nil || !filepath.IsLocal(rel) {
    return nil, fmt.Errorf("unauthorized path access: %s", cleanDir)
}
tok, err := tokenizer.Load(cleanDir)
```


## Category: injection

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


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: interface protocol hardening

### Sanitize Hop-by-Hop Headers During Request Proxying

**Use when**

When proxying requests and responses between clients and cloud endpoints

**Secure rules**

**Rule 1: Strip hop-by-hop headers and connection-token headers before forwarding requests or responses**

When proxying requests or responses between clients and cloud endpoints, always strip hop-by-hop headers, including headers enumerated inside the `Connection` header token list. Custom headers marked in `Connection` must not be forwarded upstream or downstream to prevent HTTP request smuggling and proxy confusion.

```go
src := http.Header{}
src.Add("Connection", "keep-alive, X-Trace-Hop")
src.Add("X-Trace-Hop", "drop-me")

dst := http.Header{}
copyProxyRequestHeaders(dst, src)
// dst will have Connection and X-Trace-Hop removed
```


## Category: network boundary

### Enforce Strict Loopback and Endpoint Allowlisting for Network Boundaries

**Use when**

Configuring network endpoints, proxy targets, remote model destinations, and subprocess bindings across trust boundaries.

**Secure rules**

**Rule 1: Validate remote model hostnames against allowed remote configurations.**

Ensure remote model requests target endpoints matching allowed remote domains specified in allowed remote configurations and environment variables.

```go
req := api.GenerateRequest{
    Model: "remote-model-alias",
    Prompt: "Summarize this context",
}
```

**Rule 2: Restrict production proxy target overrides to loopback addresses.**

In release mode, enforce strict validation of proxy target base URLs so that non-loopback HTTP endpoints are rejected and only loopback addresses are allowed.

```go
baseURL, signingHost, overridden, err := resolveCloudProxyBaseURL(overrideURL, gin.ReleaseMode)
if err != nil {
    return err
}
```

**Rule 3: Bind backend processes and local endpoints exclusively to loopback addresses.**

Restrict inter-process communication and local client connections by mapping wildcard hosts to loopback addresses such as `127.0.0.1`.

```go
os.Setenv("OLLAMA_HOST", "http://127.0.0.1:11434")
o := &OMP{}
if err := o.ConfigureWithModels("glm-5.1:cloud", models); err != nil {
    log.Fatalf("Failed to configure OMP models: %v", err)
}
```


## Category: resource exhaustion

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


## Category: runtime environment hardening

### Disable Developer Tools in Production Webview Builds

**Use when**

When configuring production builds that utilize webview interfaces to ensure developer inspection tools and context menus are disabled.

**Secure rules**

**Rule 1: Set the debug parameter to zero when creating production webview instances to disable internal developer tools.**

Ensure that the `debug` parameter passed to `webview_create` is explicitly set to `0` in production builds. This prevents attackers from inspecting internal application state, manipulating the webview context, or executing bound native host APIs interactively.

```c
#ifdef NDEBUG
int debug_mode = 0;
#else
int debug_mode = 1;
#endif

webview_t w = webview_create(debug_mode, NULL);
```

**Rule 2: Regularly update Ollama deployments to the latest official release version**

Keep Ollama deployments updated to the latest official release or Docker image to maintain runtime security and incorporate necessary vulnerability patches.

```bash
# Update Ollama using the official installer on Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Or update a Docker-based deployment:
docker pull ollama/ollama:latest
```


## Category: secret handling

### Redact Sensitive Environment Variables Before Logging Subprocess State

**Use when**

When logging execution environments or configuration maps for model runners that may contain sensitive credentials.

**Secure rules**

**Rule 1: Filter and redact sensitive key-value pairs containing API keys, tokens, secrets, or credentials before passing them to application logs.**

Sanitize environment variable keys and redact sensitive values using helper functions before passing them to loggers to prevent credential leakage in log output.

```go
func redactEnvValue(key, value string) string {
    for _, token := range []string{"API", "KEY", "TOKEN", "SECRET", "PASSWORD", "CREDENTIAL", "AUTH"} {
        if strings.Contains(strings.ToUpper(key), token) {
            return "[redacted]"
        }
    }
    return value
}
```


## Category: security control integrity

### Fail Closed on SQLite Foreign Key Constraint Initialization

**Use when**

When initializing SQLite database connections for data storage and state management.

**Secure rules**

**Rule 1: Enforce SQLite foreign key constraints immediately during connection establishment and database initialization.**

Always configure SQLite database connections to enforce foreign key constraints by appending `_foreign_keys=on` to the DSN and executing `PRAGMA foreign_keys = ON` upon initialization to maintain data integrity and prevent cascading delete failures.

```go
conn, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on&_journal_mode=WAL&_busy_timeout=5000&_txlock=immediate")
if err != nil {
    return nil, err
}
_, err = conn.Exec("PRAGMA foreign_keys = ON")
```
