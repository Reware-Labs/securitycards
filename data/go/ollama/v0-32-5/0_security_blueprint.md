# Security blueprint

Repository: `https://github.com/ollama/ollama#v0.32.5`

## Security posture

Ollama relies on a defense-in-depth model that secures model provenance, multi-tenant file operations, local network boundaries, and execution controls. Developers must explicitly validate model paths, enforce strict loopback bindings, and sanitize untrusted prompt inputs and native binding payloads. Any ambiguity in configuration sources, path traversals, or memory limits must fail closed to prevent resource exhaustion and unauthorized access.

## Essential implementation rules

1. **Enforce Interactive Authorization Checks for Tool Execution**

Keep `AllowAllTools` set to false and require explicit `ApprovalPrompter` configurations so that sensitive model-initiated tool executions and shell commands require human authorization.

2. **Validate File Inputs Before Processing OpenAI Adapter Requests**

Filter out unsupported file inputs before invoking OpenAI request processing to prevent unexpected error handling and parsing failures in `convertResponsesContent`.

3. **Enforce Token Validation and Server Security Settings for UI APIs**

Ensure `Server.Dev` is set to `false` in production to enforce incoming token cookie validation on all protected UI endpoints.

4. **Validate Authentication Tokens and Realms in Registry Transfers**

Implement dynamic `GetToken` callbacks that inspect challenge parameters and strictly validate that challenge realm URLs match trusted registry prefixes.

5. **Validate Model Namespaces and Paths to Prevent Traversal**

Parse and validate model names, resolve symbolic links via `filepath.EvalSymlinks`, and ensure `IsFullyQualified()` returns true before calling `.Filepath()` or loading tokenizers.

6. **Validate Native Binding Arguments at the Bridge Boundary**

Treat incoming JSON parameters in native binding callbacks as untrusted input, fully parsing and validating all arguments before executing system or file operations.

7. **Enforce Loopback Restrictions and Secure Provenance for Configuration**

Restrict cloud base URLs to secure HTTPS loopback enclaves, verify tokenizer and model file checksums, and control configuration directory environment variables.

8. **Disable Agent Shell Tool Execution in Restricted Environments**

Export `OLLAMA_AGENT_DISABLE_SHELL=1` prior to launching agent sessions to prevent the runtime from registering and executing local shell commands.

9. **Validate Model File Formats and Metadata Prior to Deserialization**

Enforce strict MIME type and extension checks, prioritize safe formats like Safetensors and GGUF, and safely decode tensor headers and shapes before parsing binary weights.

10. **Enforce Restrictive File Permissions and Extension Allowlists**

Create sensitive configuration and token files with `0600` permissions and validate uploaded files against explicit allowed extension sets.

11. **Sanitize Prompt Control Tags in Untrusted User Inputs**

Strip or encode structural prompt control tags such as `<start_of_turn>` and `<escape>` from user inputs and tool responses before submitting them to model APIs.

12. **Validate API Request Parameters Against Expected Input Contracts**

Enforce valid numerical ranges for generation parameters like `top_logprobs` and supply strict JSON schema definitions for structured outputs and tool definitions.

13. **Canonicalize and Sanitize Untrusted Prompt Inputs and Control Tokens**

Sanitize untrusted user input before tokenization or prompt generation, and remember that tokenizer decodes omit null bytes (`0x00`) during reconstruction.

14. **Strip Hop-by-Hop Headers During Request Proxying**

Strip hop-by-hop headers and custom headers enumerated inside the `Connection` header token list before forwarding requests or responses between clients and cloud endpoints.

15. **Restrict Network Endpoints and Bind Backends to Loopback**

Validate remote model hostnames against allowed remote configurations, reject non-loopback proxy targets in release mode, and bind backend processes to `127.0.0.1`.

16. **Configure Context Limits, Token Budgets, and Upload Size Constraints**

Specify explicit context limits via `num_ctx`, cap generation budgets using `NumPredict`, and enforce maximum file and decompressed payload size limits.

17. **Manage Model Memory Residency, Concurrency, and Cache Sessions**

Explicitly unload idle models using `keep_alive`, set conservative concurrency limits for blob transfers, and close cache sessions securely using `defer session.close()`.

18. **Disable Developer Tools in Production Webview Builds**

Set the debug parameter passed to `webview_create` to `0` in production builds to prevent internal developer tooling inspection and interactive API execution.

19. **Redact Sensitive Environment Variables Before Logging Subprocess State**

Filter and redact environment variable keys containing API keys, tokens, or credentials before passing them to application logs.

20. **Fail Closed on SQLite Foreign Key Constraint Initialization**

Configure SQLite connections with `_foreign_keys=on` and execute `PRAGMA foreign_keys = ON` immediately upon initialization to maintain database integrity.
