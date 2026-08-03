# Security blueprint

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`

## Security posture

When building applications and agentic workflows in LangChain, developers must assume that model inputs, tool outputs, and external data sources are untrusted and capable of malicious manipulation. The library provides security boundaries such as SSRF protection, secret masking, container isolation policies, and structured validation, but relies on developers to correctly enforce schema definitions, runtime limits, and approval boundaries. Any ambiguous tool choices, unvalidated user URLs, malformed tool arguments, or unconstrained deserialization payloads must fail closed to protect downstream resources and maintain state isolation.

## Essential implementation rules

1. **Restrict Agent Tool Execution Permissions and Allowed Decisions**

Explicitly configure allowed decision types when using `HumanInTheLoopMiddleware` to control agent tool execution interrupts. Restrict tool-level `allowed_decisions` to prevent users or interface adapters from injecting synthetic tool responses or executing unreviewed actions that bypass security approval controls.

2. **Validate API Invariants, Component Parameters, and Tool Choices**

Ensure text splitter `chunk_size` is greater than zero and `chunk_overlap` is non-negative and smaller than `chunk_size`. When configuring streaming chat models or tools, validate parameter compatibility, avoid multi-prompt generation conflicts, and ensure `tool_choice` names correspond directly to supplied tools.

3. **Authenticate Chat Models Using Dynamic Token Providers**

Authenticate Codex, Azure, and cloud-backed chat models using dynamic token provider instances such as `azure_ad_token_provider` or short-lived credential generators rather than static API keys to avoid credential leakage.

4. **Enforce Strict Path Boundaries and Allowed Prefixes for File and Workspace Tools**

Pass explicit directory boundaries using `allowed_path_prefixes` for Anthropic tool middleware and configure `FilesystemFileSearchMiddleware` with an explicit isolated `root_path` to block path traversal, symlink escapes, and unauthorized filesystem access.

5. **Use Isolated Container Policies for Agent Shell Executions**

Explicitly pass an isolated execution policy such as `DockerExecutionPolicy` when running agents in untrusted or multi-tenant environments instead of relying on host privileges. Enforce non-root user execution, read-only root filesystems, command timeouts, and resource limits.

6. **Restrict Allowed Objects During Deserialization**

When calling `loads()` with untrusted input payloads, avoid default settings like `allowed_objects='core'` or `allowed_objects='all'`. Explicitly restrict `allowed_objects` to `'messages'` or provide an explicit list of trusted `Serializable` subclasses.

7. **Prevent Role Spoofing by Using XML Formatting for Conversation Buffers**

When calling `get_buffer_string()`, always pass `format='xml'` instead of relying on the default prefix format to ensure content containing role-like strings or line breaks cannot spoof system or AI turns.

8. **Define Explicit Input Schemas and Validate Tool and Chain Arguments**

Define explicit input schemas using Pydantic `BaseModel` subclasses via `args_schema` for all `BaseTool` instances, and ensure raw user inputs passed into `Runnable` chains strictly conform to expected input schemas.

9. **Validate Model Fallback Specifications Against Trusted Allowlists**

When configuring fallback models using `ModelFallbackMiddleware`, pass explicit, trusted model instances rather than allowing dynamic construction from untrusted configuration to prevent forwarding sensitive context to unauthorized endpoints.

10. **Inspect Model Tool Call Arguments and Parse Outputs Securely**

Inspect responses for `AIMessage.invalid_tool_calls` and validate parsed tool call arguments against expected Pydantic schemas prior to downstream tool execution. Handle `OutputParserException` when parsing structured YAML or model outputs.

11. **Enforce HTTP/HTTPS Protocols and SSRF Protection for Outbound Requests**

Ensure service base URLs use valid `http` or `https` schemes. When processing untrusted URLs from user inputs or agent tool arguments, use `validate_url` and `SSRFPolicy` to block private IPs, loopback addresses, and cloud metadata endpoints.

12. **Configure Resource Limits, Timeouts, and Context Window Constraints**

Set strict execution timeouts, retry limits, and resource constraints on model clients, runnables, and shell tools. Use utilities like `trim_messages` with `include_system=True` and token counters to prevent unbounded conversation histories from exhausting context windows.

13. **Protect API Keys and Redact Sensitive Data Across Storage and Streams**

Wrap API keys and tokens in Pydantic `SecretStr` instances or environment variables. Use `PIIMiddleware`, redaction rules, and secret masking in serialization and shell tools to scrub credentials and tokens before returning results to models or logs.
